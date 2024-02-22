import React, { useEffect, useRef, useState } from 'react';

const DivisasComponent: React.FC = () => {
  const [forexData, setForexData] = useState<any[]>([]);
  const [page, setPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState(0);
  const ws = useRef<null | WebSocket >(null) //Uso una referencia para usar el socket en diferentes scopes
  const symbolsPerPage = 10; //Cantidad de divisas por pagina
  const start = page * symbolsPerPage; //Calculo la posicion de la primer divisa a mostrar en pantalla
  const end = start + symbolsPerPage; // calculo la posicion de la ultima divisa

  useEffect(() => {
    ws.current = new WebSocket('wss://wssx.gntapi.com:443');  //llamada a websocket

    ws.current.onopen = () => {
      console.log('Conectado a WebSocket');
      ws.current?.send('GNT18') //virtual handshake para obtener precios
    };

    ws.current.onclose = () => {
      console.log('Desconectado de WebSocket');
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    if (!ws.current) 
      return

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);  //datos se reciben en string y es necesario parsearse
      const forexSymbols = Object.keys(data); // obtiene arreglo de simbolos
      const totalPagesCount = Math.ceil(forexSymbols.length / symbolsPerPage); //cuento el maximo de paginas disponbiles

      setTotalPages(totalPagesCount);
      
      const forexPrices = forexSymbols.map((symbol) => ({ //obtiene informacion pertinente al proyecto que son symbol, ask, bid
        symbol: data[symbol].symbol,
        bid: data[symbol].bid,
        ask: data[symbol].ask
      }));

      // Compara valor de precios en socket contra valores en pantalla para asignar color
      const updatedForexData = forexPrices.map((forex, index) => ({
        ...forex,
        bidColor: forexData[index]?.bid < forex.bid ? 'text-green-600' : forexData[index]?.bid > forex.bid ? 'text-red-600' : forexData[index]?.bidColor,
        askColor: forexData[index]?.ask < forex.ask ? 'text-green-600' : forexData[index]?.ask > forex.ask ? 'text-red-600' : forexData[index]?.askColor
      }));

      setForexData(updatedForexData);
    };
  }, [forexData, ws.current, page]);

  //paginacion de tabla
  const handleNextPage = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePrevPage = () => {
    setPage((prevPage) => Math.max(prevPage - 1, 0));
  };

  return (
    <div className="container mx-auto">
      <div className='flex justify-center'>
        <h1 className="text-3xl font-bold my-4">Forex Prices</h1>
      </div>
      <div className="flex justify-center">
      <table className="table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2">Symbol</th>
            <th className="px-4 py-2">Bid</th>
            <th className="px-4 py-2">Ask</th>
          </tr>
        </thead>
        <tbody>
          {forexData.slice(start, end).map((forex) => (
            <tr key={forex.symbol} className="bg-gray-800">
              <td className="border px-4 py-2">{forex.symbol}</td>
              <td className={`border px-4 py-2 ${forex.bidColor}`}>{forex.bid}</td>
              <td className={`border px-4 py-2 ${forex.askColor}`}>{forex.ask}</td>
            </tr>
          ))}
        </tbody>
      </table>      
      </div>
      <div className="flex justify-center mt-4">
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 mr-2 rounded"
          onClick={handlePrevPage}
          disabled={page === 0}
        >
          Previous
        </button>
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={handleNextPage}
          disabled={page === totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default DivisasComponent;