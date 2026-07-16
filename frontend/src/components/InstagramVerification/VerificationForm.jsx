export default function VerificationForm({
  username,
  setUsername,
  loading,
  onVerify,
}) {
  return (
    <div>
      <h2>Verify with Instagram</h2>

      <p>
        Enter your Instagram username to verify your account.
      </p>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Instagram username"
      />

      <br />
      <br />

      <button
        disabled={loading}
        onClick={onVerify}
      >
        {loading ? "Generating..." : "Verify with Instagram"}
      </button>
    </div>
  );
}