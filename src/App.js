import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

// ワインエキスパート出題地域＋世界の主要産地を含むリスト
const famousWineRegions = [
  { name: "ボルドー", lat: 44.8378, lng: -0.5792 },
  { name: "ブルゴーニュ", lat: 47.0524, lng: 4.3836 },
  { name: "シャンパーニュ", lat: 49.2563, lng: 4.0317 },
  { name: "ロワール", lat: 47.3786, lng: 0.6892 },
  { name: "アルザス", lat: 48.0714, lng: 7.3166 },
  { name: "プロヴァンス", lat: 43.5297, lng: 5.4474 },
  { name: "北ローヌ", lat: 45.5461, lng: 4.8734 },
  { name: "南ローヌ", lat: 44.3880, lng: 4.8310 },

  { name: "ピエモンテ", lat: 44.6949, lng: 8.0353 },
  { name: "トスカーナ", lat: 43.7711, lng: 11.2486 },
  { name: "ヴェネト", lat: 45.4345, lng: 11.0024 },
  { name: "フリウリ", lat: 45.9560, lng: 13.5760 },
  { name: "アルト・アディジェ", lat: 46.4983, lng: 11.3548 },

  { name: "リオハ", lat: 42.465, lng: -2.448 },
  { name: "リベラ・デル・ドゥエロ", lat: 41.6, lng: -3.7 },
  { name: "ペネデス", lat: 41.383, lng: 1.683 },

  { name: "モーゼル", lat: 49.733, lng: 6.6833 },
  { name: "ラインガウ", lat: 50.033, lng: 8.083 },
  { name: "バーデン", lat: 48.5, lng: 8.0 },

  { name: "ドウロ", lat: 41.1600, lng: -7.7883 },

  { name: "ナパ・バレー", lat: 38.5025, lng: -122.2654 },
  { name: "ソノマ", lat: 38.2919, lng: -122.4580 },
  { name: "ウィラメット", lat: 45.2100, lng: -123.1100 },
  { name: "フィンガー・レイクス", lat: 42.6150, lng: -76.3930 },
  { name: "ロングアイランド", lat: 40.7891, lng: -72.8223 },

  { name: "メンドーサ", lat: -32.8908, lng: -68.8272 },
  { name: "ウコ・ヴァレー", lat: -33.5784, lng: -69.0696 },

  { name: "バロッサ・ヴァレー", lat: -34.5345, lng: 138.9573 },
  { name: "ヤラ・ヴァレー", lat: -37.6560, lng: 145.5120 },
  { name: "マクラーレン・ヴェール", lat: -35.2167, lng: 138.5333 },
  { name: "クレア・ヴァレー", lat: -33.8333, lng: 138.6000 },

  { name: "マールボロ", lat: -41.5134, lng: 173.9574 },
  { name: "セントラル・オタゴ", lat: -45.0167, lng: 169.2167 },

  { name: "ケープ・ワインランド", lat: -33.9321, lng: 18.8602 },
  { name: "ステレンボッシュ", lat: -33.933, lng: 18.850 },
  { name: "パール", lat: -33.7333, lng: 18.9667 },

  { name: "レバノン ベカー高原", lat: 33.8457, lng: 35.901 },
  { name: "チリ マイポ・ヴァレー", lat: -33.6189, lng: -70.6293 },

  { name: "ナイアガラ", lat: 43.2540, lng: -79.0730 },
  { name: "オカナガン", lat: 49.8880, lng: -119.4960 },

  { name: "トカイ", lat: 48.1206, lng: 21.4083 },

  // 日本
  { name: "甲州", lat: 35.6641, lng: 138.5683 },
  { name: "北海道 余市", lat: 43.1907, lng: 140.7706 },
  { name: "北海道 池田", lat: 43.1649, lng: 143.4562 },
  { name: "信州 塩尻", lat: 36.1128, lng: 137.9537 },
  { name: "山形 高畠", lat: 38.0016, lng: 140.1680 },
  { name: "岩手 花巻", lat: 39.3886, lng: 141.1159 }
];

const grapeVarieties = ["カベルネ・ソーヴィニヨン", "メルロー", "ピノ・ノワール", "シャルドネ", "ソーヴィニヨン・ブラン", "甲州", "リースリング", "シラー", "グルナッシュ", "ネッビオーロ"];
const wineTypes = ["赤", "白", "ロゼ", "泡", "オレンジ"];

function getOffsetPosition(index, total, radius = 0.002) {
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
  const [tab, setTab] = useState("map"); // タブ切替状態

  useEffect(() => {
    localStorage.setItem("wines", JSON.stringify(wines));
  }, [wines]);

  const getCoordinatesFromLocation = async (location) => {
    const matchedRegion = famousWineRegions.find(r => r.name === location);
    if (matchedRegion) {
      return { lat: matchedRegion.lat, lng: matchedRegion.lng };
    }
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
    const data = await response.json();
    if (data.length === 0) throw new Error("場所が見つかりません");
    return { lat: data[0].lat, lng: data[0].lon };
  };

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleAddWine = async () => {
    if (!form.name || !form.location) return alert("名前と場所を入力してください。");
    try {
      const coords = await getCoordinatesFromLocation(form.location);
      let imageData = "";
      if (form.image) imageData = await toBase64(form.image);
      const newWine = { ...form, lat: coords.lat, lng: coords.lng, image: imageData };
      setWines([...wines, newWine]);
      setForm({ name: "", grape: "", comment: "", lat: "", lng: "", image: null, type: "赤", location: "" });
    } catch (error) {
      alert(error.message);
    }
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
    <div className="p-4 space-y-4">
      <div className="flex gap-4 mb-4">
        <button className={tab === "map" ? "font-bold underline" : ""} onClick={() => setTab("map")}>ワインマップ</button>
        <button className={tab === "list" ? "font-bold underline" : ""} onClick={() => setTab("list")}>一覧表</button>
      </div>

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

      <div className="space-y-4">
        <div>種類で絞り込み：<br />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="すべて">すべて</option>
            {wineTypes.map((type, index) => (
              <option key={index} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>品種で絞り込み：<br />
          <input list="grape-options" type="text" value={filterGrape} onChange={(e) => setFilterGrape(e.target.value)} className="border rounded px-2 py-1" />
        </div>
        <div>産地で絞り込み：<br />
          <input list="location-options" type="text" value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="border rounded px-2 py-1" />
        </div>
      </div>

      {tab === "map" ? (
        <WorldWineRecordAppCore wines={filteredWines} handleDeleteWine={handleDeleteWine} />
      ) : (
        <WineListView wines={filteredWines} />
      )}
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
            const matchedRegion = famousWineRegions.find(r => r.name === wine.location);
            const baseLat = matchedRegion ? matchedRegion.lat : parseFloat(wine.lat);
            const baseLng = matchedRegion ? matchedRegion.lng : parseFloat(wine.lng);

            const key = `${baseLat}-${baseLng}`;
            if (!markerMap[key]) markerMap[key] = [];
            markerMap[key].push(index);
            const offsetIndex = markerMap[key].indexOf(index);
            const [offsetLat, offsetLng] = getOffsetPosition(offsetIndex, markerMap[key].length, matchedRegion ? 0.006 : 0.006);

            return (
              <Marker
                key={index}
                position={[baseLat + offsetLat, baseLng + offsetLng]}
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

function WineListView({ wines }) {
  return (
    <div className="grid grid-cols-1 gap-4 mt-6">
      {wines.map((wine, index) => (
        <div key={index} className="flex gap-4 items-start border p-4 rounded shadow">
          {wine.image && <img src={wine.image} alt={wine.name} className="w-24 h-24 object-cover rounded" />}
          <div>
            <h3 className="text-lg font-bold">{wine.name}</h3>
            <p>品種: {wine.grape}</p>
            <p>種類: {wine.type}</p>
            <p>産地: {wine.location}</p>
            <p className="mt-1 text-sm text-gray-700">{wine.comment}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
