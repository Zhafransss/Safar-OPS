// Precached by public/sw.js, so it must stay static and free of user data (FR-PWA-02).
export default function OfflinePage() {
  return (
    <>
      <div className="home-hd">
        <div>
          <div className="h1">SAFAR OPS 2</div>
          <div className="hi">Anda sedang offline</div>
        </div>
      </div>
      <div style={{ margin: "-40px 14px 0" }}>
        <div className="card">
          <p className="small" style={{ lineHeight: 1.5, margin: 0 }}>
            Periksa koneksi internet Anda, lalu buka kembali aplikasi.
          </p>
        </div>
      </div>
    </>
  );
}
