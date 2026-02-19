export { getConfig, isEhdmConfigured } from "./config";
export { ehdmPost } from "./client";
export { getNextSeqAndIncrement, decrementSeq } from "./seq";
export { buildPrintBody, callPrint } from "./print";
export type { OrderWithItemsAndPayments } from "./print";
export { printReceiptForOrder } from "./print-for-order";
export type {
  EhdmConfig,
  EhdmPrintRequestBody,
  EhdmPrintResponse,
  EhdmPrintResult,
  EhdmPrintItem,
} from "./types";
