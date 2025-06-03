import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet/dist/leaflet.css";
import "./App.css";

const famousWineRegions = [
  { name: "ボルドー", lat: 44.8378, lng: -0.5792 },
  { name: "ブルゴーニュ", lat: 47.0524, lng: 4.3836 },
  { name: "シャンパーニュ", lat: 49.2563, lng: 4.0317 },
  { name: "ロワール", lat: 47.3786, lng: 0.6892 },
  { name: "アルザス", lat: 48.0714, lng: 7.3166 },
  { name: "プロヴァンス", lat: 43.5297, lng: 5.4474 },
  { name: "ピエモンテ", lat: 44.6949, lng: 8.0353 },
  { name: "トスカーナ", lat: 43.7711, lng: 11.2486 },
  { name: "リオハ", lat: 42.4650, lng: -2.4480 },
  { name: "ナパ・バレー", lat: 38.5025, lng: -122.2654 },
  { name: "モーゼル", lat: 49.7330, lng: 6.6833 },
  { name: "マールボロ（NZ）", lat: -41.5134, lng: 173.9574 },
  { name: "バロッサ・ヴァレー（豪）", lat: -34.5345, lng: 138.9573 },
  { name: "ケープ・ワインランド（南ア）", lat: -33.9321, lng: 18.8602 },
  { name: "レバノン ベカー高原", lat: 33.8457, lng: 35.9010 },
  { name: "チリ マイポ・ヴァレー", lat: -33.6189, lng: -70.6293 },
  { name: "アルゼンチン メンドーサ", lat: -32.8908, lng: -68.8272 }
];

export default function WorldWineRecordApp() {
  const [wines, setWines] = useState(() => {
    const saved = localStorage.getItem("wines");
    return saved ? JSON.parse(saved) : [];
  });
  const [form, setForm] = useState({ name: "", grape: "", comment: "", lat: "", lng: "", image: null, type: "赤", location: "" });
  const [filterType, setFilterType] = useState("すべて");
  const [filterGrape, setFilterGrape] = useState("");
  const [filterLocation, setFilterLocation] = useState("");

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

  const jitterCoordinates = (lat, lng) => {
    const jitter = 0.002;
    const randomOffset = () => (Math.random() - 0.5) * jitter;
    return [parseFloat(lat) + randomOffset(), parseFloat(lng) + randomOffset()];
  };

  const handleAddWine = async () => {
    if (!form.name || !form.location) return alert("名前と場所を入力してください。");
    try {
      const coords = await getCoordinatesFromLocation(form.location);
      let imageData = "";
      if (form.image) {
        imageData = await toBase64(form.image);
      }
      const newWine = { ...form, lat: coords.lat, lng: coords.lng, image: imageData };
      setWines([...wines, newWine]);
      setForm({ name: "", grape: "", comment: "", lat: "", lng: "", image: null, type: "赤", location: "" });
    } catch (error) {
      alert(error.message);
    }
  };

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDeleteWine = (index) => {
    if (window.confirm("この記録を削除しますか？")) {
      const updatedWines = [...wines];
      updatedWines.splice(index, 1);
      setWines(updatedWines);
    }
  };

  const getPinIcon = (type) => {
    const iconUrlMap = {
      "赤": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
      "白": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-yellow.png",
      "泡": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
      "ロゼ": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-violet.png",
      "オレンジ": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png",
      "その他": "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-grey.png"
    };

    return L.icon({
      iconUrl: iconUrlMap[type] || iconUrlMap["その他"],
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
      shadowSize: [41, 41],
      shadowAnchor: [12, 41]
    });
  };

  const filteredWines = wines.filter(w =>
    (filterType === "すべて" || w.type === filterType) &&
    (filterGrape === "" || w.grape.includes(filterGrape)) &&
    (filterLocation === "" || w.location.includes(filterLocation))
  );

  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded p-4 shadow">
        <h1 className="text-xl font-bold mb-2">ワインを記録</h1>
        <input className="border p-1 m-1" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="ワイン名" />
        <input className="border p-1 m-1" value={form.grape} onChange={e => setForm({ ...form, grape: e.target.value })} placeholder="ブドウ品種（例：カベルネ）" />
        <input className="border p-1 m-1" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} placeholder="コメント" />
        <select className="border p-1 m-1" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
          <option>赤</option>
          <option>白</option>
          <option>泡</option>
          <option>ロゼ</option>
          <option>オレンジ</option>
          <option>その他</option>
        </select>
        <input className="border p-1 m-1 block" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="産地（例：フランス ボルドー）" />
        <input type="file" className="m-1" onChange={e => setForm({ ...form, image: e.target.files[0] })} />
        <button onClick={handleAddWine} className="bg-blue-500 text-white px-3 py-1 m-1 rounded">追加</button>
        <button onClick={() => setWines([])} className="bg-gray-500 text-white px-3 py-1 m-1 rounded">全て削除</button>

        <div className="mt-2">
          <label>種類で絞り込み: </label>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border p-1 m-1">
            <option>すべて</option>
            <option>赤</option>
            <option>白</option>
            <option>泡</option>
            <option>ロゼ</option>
            <option>オレンジ</option>
            <option>その他</option>
          </select>
          <br />
          <label>品種で絞り込み: </label>
          <input value={filterGrape} onChange={e => setFilterGrape(e.target.value)} className="border p-1 m-1" />
          <br />
          <label>産地で絞り込み: </label>
          <input value={filterLocation} onChange={e => setFilterLocation(e.target.value)} className="border p-1 m-1" />
        </div>
      </div>

      <div className="border rounded p-4 shadow">
        <MapContainer center={[48.8566, 2.3522]} zoom={2} className="leaflet-container" worldCopyJump={true} maxBounds={[[-90, -180], [90, 180]]}>
          <TileLayer
            url="https://{s}.tile.jawg.io/jawg-light/{z}/{x}/{y}{r}.png?access-token=vGHm48FRyY5iqA40201IfFrej1wI1hPlF9DvCurHGcxIg7mddMEnsgqPdP9ok5Ms"
            attribution="&copy; OpenStreetMap contributors, Tiles &copy; Jawg"
          />

          {famousWineRegions.map((region, i) => (
            <Circle
              key={`region-${i}`}
              center={[region.lat, region.lng]}
              radius={50000}
              pathOptions={{ color: "purple", fillOpacity: 0.2 }}
            >
              <Popup>{region.name}</Popup>
            </Circle>
          ))}

          {filteredWines.map((wine, index) => {
            const jitteredPos = jitterCoordinates(wine.lat, wine.lng);
            return (
              <Marker
                key={index}
                position={jitteredPos}
                icon={getPinIcon(wine.type)}
              >
                <Popup>
                  <strong>{wine.name}</strong>
                  <br />
                  品種: {wine.grape}
                  <br />
                  種類: {wine.type}
                  <br />
                  {wine.comment}
                  <br />
                  {wine.image && <img src={wine.image} alt="wine" className="w-32 mt-1" />}
                  <br />
                  <button onClick={() => handleDeleteWine(index)} className="text-sm text-red-500 underline mt-2">この記録を削除</button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <h2 className="text-xl font-bold mt-4">ワイン一覧</h2>
        <table className="table-auto w-full mt-2 border">
          <thead>
            <tr>
              <th className="border px-2">名前</th>
              <th className="border px-2">品種</th>
              <th className="border px-2">種類</th>
              <th className="border px-2">産地</th>
              <th className="border px-2">コメント</th>
            </tr>
          </thead>
          <tbody>
            {filteredWines.map((wine, idx) => (
              <tr key={idx}>
                <td className="border px-2">{wine.name}</td>
                <td className="border px-2">{wine.grape}</td>
                <td className="border px-2">{wine.type}</td>
                <td className="border px-2">{wine.location}</td>
                <td className="border px-2">{wine.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
