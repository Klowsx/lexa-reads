import { deleteAccountHandler } from './handler.ts'

// El punto de entrada Edge registra el manejador, separado para probar el contrato HTTP.
Deno.serve(deleteAccountHandler)
