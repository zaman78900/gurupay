import { useApp } from "../context/AppContext";

export function useStudents(batchId) {
  const { state, dispatch } = useApp();

  const students = batchId
    ? state.students.filter((s) => s.batchId === batchId)
    : state.students;

  const addStudent = (student) =>
    dispatch({
      type: "ADD_STUDENT",
      payload: { ...student, id: Date.now().toString() },
    });

  const updateStudent = (student) =>
    dispatch({ type: "UPDATE_STUDENT", payload: student });

  const deleteStudent = (id) =>
    dispatch({ type: "DELETE_STUDENT", payload: id });

  return { students, addStudent, updateStudent, deleteStudent };
}