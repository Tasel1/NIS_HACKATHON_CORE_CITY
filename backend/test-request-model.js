require("dotenv").config({ path: "./backend/.env" });
const Request = require("./models/Request");

async function test() {
  // 1. Создание заявки
  const newRequest = await Request.create({
    citizen_id: 1,
    category: "Дороги",
    description: "Яма на дороге",
    lat: 55.75,
    lng: 37.61,
    address: "ул. Тверская, 1",
  });
  console.log("✅ Created:", newRequest.id);

  // 2. Получение списка
  const list = await Request.findAll({ status: "pending" });
  console.log("📋 Pending requests:", list.length);

  // 3. Получение по ID с фото и логами
  const request = await Request.findById(newRequest.id);
  console.log("🔍 Found:", request.id, "photos:", request.photos.length);

  // 4. Обновление статуса
  await Request.updateStatus(newRequest.id, "in_progress", 1);
  console.log("🔄 Status updated");

  // 5. Назначение исполнителя
  await Request.assignWorker(newRequest.id, 4, "2026-02-20");
  console.log("👷 Worker assigned");

  // 6. Подтверждение гражданина
  await Request.approve(newRequest.id, true, "Всё отлично!");
  console.log("👍 Citizen approved");
}
test().catch(console.error);
