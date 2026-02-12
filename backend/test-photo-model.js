// backend/test-photo-model.js
require("dotenv").config({ path: __dirname + "/.env" });
const Photo = require("./models/Photo");

async function testPhotoModel() {
  console.log("🧪 ТЕСТИРОВАНИЕ Photo MODEL...\n");

  // 1. Создание записи о фото
  console.log("1. Добавляем фото к заявке #1...");
  const newPhoto = await Photo.create({
    request_id: 1,
    photo_type: "problem",
    file_path: "/uploads/7_1234567890_abc.jpg",
    uploaded_by: 1,
  });
  console.log("   ✅ Создано фото ID:", newPhoto.id);

  // 2. Получение всех фото заявки
  console.log("\n2. Получаем фото заявки #1...");
  const photos = await Photo.findByRequestId(1);
  console.log("   ✅ Найдено фото:", photos.length);
  console.log("   📸 Первое фото:", photos[0]?.file_path);

  console.log("\n🎉 Все тесты Photo Model пройдены!");
}

testPhotoModel().catch((err) => {
  console.error("\n❌ Тест упал с ошибкой:", err);
});
