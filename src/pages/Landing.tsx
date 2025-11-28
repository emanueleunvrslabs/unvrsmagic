const Landing = () => {
  return (
    <iframe
      src="/webflow/index.html"
      style={{
        width: "100%",
        height: "100vh",
        border: "none",
        display: "block",
        margin: 0,
        padding: 0,
        position: "fixed",
        top: 0,
        left: 0
      }}
      title="UNVRS Labs"
      sandbox="allow-scripts allow-same-origin"
    />
  );
};

export default Landing;
