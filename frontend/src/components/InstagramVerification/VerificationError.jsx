export default function VerificationError({
  message,
  onRetry,
}) {
  return (
    <div>
      <h2>Verification Failed</h2>

      <p>{message}</p>

      <button onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}