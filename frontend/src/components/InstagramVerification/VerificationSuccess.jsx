export default function VerificationSuccess({
  anonymousName,
  onContinue,
}) {
  return (
    <div>
      <h1>🎉 Welcome!</h1>

      <p>
        Your Instagram account has been verified.
      </p>

      <h3>Your Anonymous Identity</h3>

      <h2>{anonymousName}</h2>

      <p>
        This is how everyone on the platform will know you.
        Your real Instagram identity is never shown to other users.
      </p>

      <button onClick={onContinue}>
        Continue
      </button>
    </div>
  );
}