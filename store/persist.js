export function persist(action, ...args) {
  try {
    const result = action(...args);
    if (result && typeof result.catch === "function") {
      result.catch((error) => console.warn("DB operation failed", error));
    }
  } catch (error) {
    console.warn("DB operation failed", error);
  }
}
