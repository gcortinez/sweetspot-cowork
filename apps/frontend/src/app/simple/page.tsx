export default function SimplePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#3b82f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "0.5rem",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: "2.25rem",
            fontWeight: "bold",
            color: "#111827",
            marginBottom: "1rem",
          }}
        >
          Inline Styles Test
        </h1>
        <p style={{ color: "#4b5563" }}>
          If you can see this styled correctly, the issue is with Tailwind
          classes!
        </p>
        <div className="mt-4">
          <p className="text-red-500 font-bold">
            This text should be red if Tailwind is working
          </p>
        </div>
      </div>
    </div>
  );
}
