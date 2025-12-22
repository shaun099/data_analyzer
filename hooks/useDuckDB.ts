import * as duckdb from '@duckdb/duckdb-wasm';
import { useEffect, useState } from 'react';

export function useDuckDB() {
  const [db, setDb] = useState<duckdb.AsyncDuckDB | null>(null);

  useEffect(() => {
    const init = async () => {
      const BUNDLES = duckdb.getJsDelivrBundles();
      const bundle = await duckdb.selectBundle(BUNDLES);
      const worker = new Worker(URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker}");`], {type: 'text/javascript'})
      ));
      const database = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
      await database.instantiate(bundle.mainModule, bundle.pthreadWorker);
      setDb(database);
    };
    init();
  }, []);
  return db;
}