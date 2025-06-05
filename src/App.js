import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle,} from "react-leaflet";
import L from "leaflet";
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
  { name: "リオハ", lat: 42.465, lng: -2.448 },
  { name: "ナパ・バレー", lat: 38.5025, lng: -122.2654 },
  { name: "モーゼル", lat: 49.733, lng: 6.6833 },
  { name: "マールボロ（NZ）", lat: -41.5134, lng: 173.9574 },
  { name: "バロッサ・ヴァレー（豪）", lat: -34.5345, lng: 138.9573 },
  { name: "ケープ・ワインランド（南ア）", lat: -33.9321, lng: 18.8602 },
  { name: "レバノン ベカー高原", lat: 33.8457, lng: 35.901 },
  { name: "チリ マイポ・ヴァレー", lat: -33.6189, lng: -70.6293 },
  { name: "アルゼンチン メンドーサ", lat: -32.8908, lng: -68.8272 },
  { name: "山梨 甲州", lat: 35.6641, lng: 138.5683 },
  { name: "北海道 池田", lat: 43.1649, lng: 143.4562 }
];

const grapeVarieties = ["カベルネ・ソーヴィニヨン", "メルロー", "ピノ・ノワール", "シャルドネ", "ソーヴィニヨン・ブラン", "甲州", "リースリング", "シラー", "グルナッシュ", "ネッビオーロ"];
const wineTypes = ["赤", "白", "ロゼ", "泡", "オレンジ"];

function getOffsetPosition(index, total, radius = 0.02) {
  const angle = (2 * Math.PI * index) / total;
  return [Math.cos(angle) * radius, Math.sin(angle) * radius];
}

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

  const filteredWines = wines.filter(w =>
    (filterType === "すべて" || w.type === filterType) &&
    (filterGrape === "" || w.grape.includes(filterGrape)) &&
    (filterLocation === "" || w.location.includes(filterLocation))
  );

  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input placeholder="ワイン名" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="border p-1" />
        <input list="grape-options" placeholder="ブドウ品種" value={form.grape} onChange={e => setForm({ ...form, grape: e.target.value })} className="border p-1" />
        <datalist id="grape-options">
          {grapeVarieties.map((g, i) => <option key={i} value={g} />)}
        </datalist>
        <input placeholder="コメント" value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} className="border p-1" />
        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border p-1">
          {wineTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
        </select>
        <input list="location-options" placeholder="産地" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="border p-1" />
        <datalist id="location-options">
          {famousWineRegions.map((loc, i) => <option key={i} value={loc.name} />)}
        </datalist>
        <input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })} />
        <button onClick={handleAddWine} className="bg-blue-500 text-white px-2 py-1 rounded">追加</button>
      </div>

      <div className="mb-2 flex flex-wrap gap-2">
        <label>種類で絞り込み:
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="ml-2">
            <option value="すべて">すべて</option>
            {wineTypes.map((type, i) => <option key={i} value={type}>{type}</option>)}
          </select>
        </label>
        <label>品種で絞り込み:
          <input list="grape-options" className="ml-2 border px-1" placeholder="例: メルロー" value={filterGrape} onChange={e => setFilterGrape(e.target.value)} />
        </label>
        <label>産地で絞り込み:
          <input list="location-options" className="ml-2 border px-1" placeholder="例: ボルドー" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} />
        </label>
      </div>

      <WorldWineRecordAppCore wines={filteredWines} handleDeleteWine={handleDeleteWine} />

      <div className="mt-6">
        <h2 className="text-lg font-bold">ワイン一覧</h2>
        <table className="table-auto w-full mt-2 border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1">名前</th>
              <th className="border px-2 py-1">品種</th>
              <th className="border px-2 py-1">種類</th>
              <th className="border px-2 py-1">産地</th>
              <th className="border px-2 py-1">コメント</th>
            </tr>
          </thead>
          <tbody>
            {filteredWines.map((wine, index) => (
              <tr key={index}>
                <td className="border px-2 py-1">{wine.name}</td>
                <td className="border px-2 py-1">{wine.grape}</td>
                <td className="border px-2 py-1">{wine.type}</td>
                <td className="border px-2 py-1">{wine.location}</td>
                <td className="border px-2 py-1">{wine.comment}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WorldWineRecordAppCore({ wines, handleDeleteWine }) {
  const markerMap = {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="border rounded p-4 shadow">
        <MapContainer center={[48.8566, 2.3522]} zoom={2} className="leaflet-container" worldCopyJump={true} maxBounds={[[90, -180], [-90, 180]]}>
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

          {wines.map((wine, index) => {
            const key = `${wine.lat}-${wine.lng}`;
            if (!markerMap[key]) markerMap[key] = [];
            markerMap[key].push(index);
            const offsetIndex = markerMap[key].indexOf(index);
            const [offsetLat, offsetLng] = getOffsetPosition(offsetIndex, markerMap[key].length);

            return (
              <Marker
                key={index}
                position={[parseFloat(wine.lat) + offsetLat, parseFloat(wine.lng) + offsetLng]}
                icon={L.icon({
                  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${wine.type === "白" ? "yellow" : wine.type === "泡" ? "green" : wine.type === "ロゼ" ? "violet" : wine.type === "オレンジ" ? "orange" : "red"}.png`,
                  iconSize: [20, 32],
                  iconAnchor: [10, 32],
                  popupAnchor: [1, -30],
                  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
                  shadowSize: [32, 32],
                  shadowAnchor: [10, 32]
                })}
              >
                <Popup>
                  <strong>{wine.name}</strong>
                  <br />品種: {wine.grape}
                  <br />種類: {wine.type}
                  <br />産地: {wine.location}
                  <br />コメント: {wine.comment}
                  {wine.image && <img src={wine.image} alt="wine" className="w-32 mt-1" />}
                  <br />
                  <button onClick={() => handleDeleteWine(index)} className="text-sm text-red-500 underline mt-2">この記録を削除</button>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
