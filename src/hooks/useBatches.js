import { useApp } from "../context/AppContext";

export function useBatches() {
  const { state, dispatch } = useApp();

  const addBatch = (batch) =>
    dispatch({
      type: "ADD_BATCH",
      payload: { ...batch, id: Date.now().toString() },
    });

  const updateBatch = (batch) => dispatch({ type: "UPDATE_BATCH", payload: batch });

  const deleteBatch = (id) => dispatch({ type: "DELETE_BATCH", payload: id });

  const getBatchById = (id) => state.batches.find((b) => b.id === id);

  return { batches: state.batches, addBatch, updateBatch, deleteBatch, getBatchById };
}