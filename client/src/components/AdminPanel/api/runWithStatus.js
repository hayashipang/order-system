export async function runWithStatus(asyncFn, {
  setLoading,
  setError,
  setSuccess,
  okMsg,
  errMsg,
} = {}) {
  if (setLoading) setLoading(true);
  if (setError) setError("");
  if (setSuccess) setSuccess("");

  try {
    const result = await asyncFn();
    if (okMsg && setSuccess) setSuccess(okMsg);
    return result;
  } catch (err) {
    if (setError) setError(errMsg || "操作失敗");
    console.error(err);
    throw err;
  } finally {
    if (setLoading) setLoading(false);
  }
}

