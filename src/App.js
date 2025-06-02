import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

export default function WorldWineRecordApp() {
  const [wines, setWines] = useState(() => {
    const saved = localStorage.getItem("wines");
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({ name: "", comment: "", lat: "", lng: "", image: "", type: "赤", location: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem("wines", JSON.stringify(wines));
  }, [wines]);

  const getCoordinatesFromLocation = async (location) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const data = await response.json();
    if (data.length === 0) throw new Error("場所が見つかりません");
    return {
      lat: data[0].lat,
      lng: data[0].lon
    };
  };

  const handleAddWine = async () => {
    if (!form.name || !form.location) return alert("名前と場所を入力してください。");
    try {
      setLoading(true);
      const coords = await getCoordinatesFromLocation(form.location);
      const newWine = { ...form, lat: coords.lat, lng: coords.lng };
      setWines([...wines, newWine]);
      setForm({ name: "", comment: "", lat: "", lng: "", image: "", type: "赤", location: "" });
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getPinColor = (type) => {
    switch (type) {
      case "白": return "blue";
      case "泡": return "green";
      default: return "red";
    }
  };

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded p-4 shadow">
        <h2 className="text-xl font-bold mb-2">ワインを記録</h2>
        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="ワイン名"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="コメント"
          value={form.comment}
          onChange={(e) => setForm({ ...form, comment: e.target.value })}
        />
        <select
          className="w-full border p-2 rounded mb-2"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option value="赤">赤</option>
          <option value="白">白</option>
          <option value="泡">泡</option>
        </select>
        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="産地（例：フランス ボルドー）"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <input
          className="w-full border p-2 rounded mb-2"
          placeholder="画像URL"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleAddWine}
          disabled={loading}
        >
          {loading ? "追加中..." : "追加"}
        </button>
      </div>

      <div className="border rounded p-4 shadow">
        <MapContainer center={[48.8566, 2.3522]} zoom={2} className="leaflet-container">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {wines.map((wine, index) => (
            <Marker
              key={index}
              position={[parseFloat(wine.lat), parseFloat(wine.lng)]}
              icon={L.icon({
                iconUrl: `https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|${getPinColor(wine.type)}`,
                iconSize: [21, 34],
                iconAnchor: [10, 34],
                popupAnchor: [0, -30]
              })}
            >
              <Popup>
                <strong>{wine.name}</strong>
                <br />
                種類: {wine.type}
                <br />
                {wine.comment}
                <br />
                {wine.image && <img src={wine.image} alt="wine" className="w-32 mt-1" />}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
