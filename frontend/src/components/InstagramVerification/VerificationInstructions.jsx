export default function VerificationInstructions({
  username,
  code,
  onCopy,
  onOpenInstagram,
  onSent,
}) {
  return (
    <div>
      <h2>Verification Code</h2>
      <h1>{code}</h1>
      <p>✅ Copied to your clipboard.</p>
      <p>Make sure you're logged into</p>
      <h3>@{username}</h3>
      <ol>
        <li>Open Instagram.</li>
        <li>Open the DM with @wit_confessions.26.</li>
        <li>Paste the code.</li>
        <li>Send it.</li>
      </ol>
      <button onClick={onCopy}>Copy Again</button>{" "}
      <button onClick={onOpenInstagram}>Open Instagram</button>{" "}
      <button onClick={onSent}>I've sent the message</button>
    </div>
  );
}
