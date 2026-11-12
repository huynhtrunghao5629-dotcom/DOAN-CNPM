-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: huegodb
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `pois`
--

DROP TABLE IF EXISTS `pois`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pois` (
  `Id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Latitude` double NOT NULL,
  `Longitude` double NOT NULL,
  `Images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `Radius` double DEFAULT NULL,
  `Narration` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AverageRating` double NOT NULL,
  `TotalReviews` int NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pois`
--

LOCK TABLES `pois` WRITE;
/*!40000 ALTER TABLE `pois` DISABLE KEYS */;
INSERT INTO `pois` VALUES ('6addf224c5656cda07dfc241','Chùa Thiên Mụ','Di tích lịch sử','Ngôi chùa cổ kính nhất đất cố đô, nằm trên đồi Hà Khê tả ngạn sông Hương.','Hương Hòa, Thành phố Huế',16.4534,107.5448,'[]',1,'2026-10-25 12:12:20.759000',50,'Bạn đang dừng chân tại chùa Thiên Mụ, ngôi chùa cổ kính và linh thiêng bậc nhất đất cố đô. Tọa lạc trên đồi Hà Khê, duyên dáng soi bóng xuống dòng sông Hương êm đềm, chùa Thiên Mụ được chúa Nguyễn Hoàng xây dựng vào năm 1601. Biểu tượng nổi bật nhất của chùa là tháp Phước Duyên hình bát giác cao 7 tầng, sừng sững vươn lên bầu trời xanh. Không chỉ là một kiệt tác kiến trúc Phật giáo, nơi đây còn lưu giữ tiếng chuông đồng vang vọng sớm chiều, cùng chiếc xe ô tô lịch sử của Bồ Tát Thích Quảng Đức. Chùa Thiên Mụ là một chốn bình yên, nơi bạn có thể tìm thấy sự thanh tịnh trong tâm hồn giữa không gian thơ mộng của xứ Huế.',0,0),('6addf22dc5656cda07dfc242','Lăng Tự Đức','Di tích lịch sử','Quần thể công trình kiến trúc lăng tẩm mang vẻ đẹp nhã nhặn, hòa hợp thiên nhiên.','Thủy Xuân, Thành phố Huế',16.4333,107.5667,'[]',1,'2026-10-25 12:12:29.718000',50,'Chào mừng đến với Lăng Tự Đức, hay còn gọi là Khiêm Lăng. Được ví như một bức tranh thủy mặc tuyệt đẹp, lăng tẩm này phản ánh rõ nét tâm hồn thi sĩ lãng mạn và tinh tế của vua Tự Đức. Khác với sự uy nghiêm của các lăng tẩm khác, lăng Tự Đức là một quần thể kiến trúc nhã nhặn, hòa quyện tuyệt đối với thiên nhiên xung quanh. Nơi đây có hồ Lưu Khiêm êm đềm, có đảo Tịnh Khiêm mướt mát bóng cây, và những dải hành lang quanh co nối liền các cung điện, lầu các. Ban đầu được xây dựng làm chốn nghỉ ngơi, tiêu dao của nhà vua lúc sinh thời, Khiêm Lăng mang một vẻ đẹp u buồn nhưng vô cùng quyến rũ, để lại ấn tượng sâu sắc trong lòng người thưởng ngoạn.',0,0),('6addf272c5656cda07dfc243','Lăng Khải Định','Di tích lịch sử','Công trình kiến trúc độc đáo pha trộn hài hòa giữa văn hóa Đông - Tây.','Thủy Bằng, Hương Thủy, Thừa Thiên Huế',16.3986,107.5847,'[]',1,'2026-10-25 12:13:38.310000',50,'Bạn đang ghé thăm Lăng Khải Định, hay Ứng Lăng, công trình kiến trúc độc đáo và gây nhiều tranh cãi nhất trong hệ thống lăng tẩm triều Nguyễn. Lăng Khải Định là sự pha trộn táo bạo và hài hòa giữa các trường phái kiến trúc Đông - Tây, Âu - Á, phản ánh cá tính của vị vua thích cái mới lạ. Dù có diện tích nhỏ nhất, nhưng đây lại là lăng tẩm tốn nhiều thời gian, công sức và tiền của nhất. Điểm nhấn rực rỡ nhất nằm ở Cung Thiên Định, với những bức phù điêu ghép bằng sành sứ và thủy tinh tinh xảo đến từng chi tiết. Lăng Khải Định như một tòa lâu đài uy nghi trên sườn núi Châu Chữ, là minh chứng cho một giai đoạn giao thoa văn hóa đặc sắc trong lịch sử Việt Nam.',0,0),('6addf28cc5656cda07dfc244','Lăng Minh Mạng','Di tích lịch sử','Lăng tẩm có kiến trúc uy nghiêm, chuẩn mực nhất của triều Nguyễn.','Hương Thọ, Hương Trà, Thừa Thiên Huế',16.3883,107.5725,'[]',1,'2026-10-25 12:14:04.517000',50,'Chào mừng bạn đến với lăng Minh Mạng, hay Hiếu Lăng. Nơi đây được đánh giá là lăng tẩm có kiến trúc uy nghiêm, bề thế và chuẩn mực nhất của triều Nguyễn. Nằm trọn trong một không gian thiên nhiên rộng lớn, lăng Minh Mạng mang đậm tư tưởng Nho giáo với trục thần đạo trung tâm đối xứng hoàn hảo. Quần thể gồm gần 40 công trình lớn nhỏ được bố trí lớp lang, chặt chẽ, từ Đại Hồng Môn, sân chầu, nhà bia, cho đến điện thờ và phần mộ của nhà vua. Sự kết hợp tinh tế giữa nghệ thuật kiến trúc hoành tráng và cảnh quan hồ nước, đồi thông rợp bóng mát đã tạo nên một vẻ đẹp đường bệ, trang nghiêm nhưng không kém phần thơ mộng, phản ánh đúng tầm vóc của một vị vua anh minh và tài lược.',0,0),('6addf298c5656cda07dfc245','Lăng Gia Long','Di tích lịch sử','Lăng mộ của vị vua sáng lập triều Nguyễn, nằm giữa quần sơn hùng vĩ.','Hương Thọ, Hương Trà, Thừa Thiên Huế',16.3533,107.5906,'[]',1,'2026-10-25 12:14:16.499000',50,'Chào mừng bạn đến với lăng Gia Long, hay Thiên Thọ Lăng, nơi an nghỉ của vị vua sáng lập ra triều đại nhà Nguyễn. Nằm cách xa trung tâm thành phố, lăng Gia Long ẩn mình tĩnh lặng giữa một quần thể núi non hùng vĩ và hoang sơ. Điểm đặc biệt nhất của lăng tẩm này là thiết kế mở, hoàn toàn không có la thành bao bọc, lấy chính những dãy núi nhấp nhô làm bức bình phong tự nhiên. Kiến trúc của lăng đơn giản, mộc mạc nhưng toát lên vẻ uy nghi, bề thế của một vị vua khai quốc. Bức tranh phong thủy hữu tình, không gian tĩnh lặng tuyệt đối hòa cùng tiếng thông reo trong gió tạo nên một cảm giác thiêng liêng, đưa du khách trở về với những trang sử đầu tiên của triều Nguyễn.',0,0),('6addf2a5c5656cda07dfc246','Đàn Nam Giao','Di tích lịch sử','Nơi các vua triều Nguyễn tổ chức lễ tế trời đất vào mùa xuân.','Trường An, Thành phố Huế',16.4444,107.5794,'[]',1,'2026-10-25 12:14:29.113000',50,'Bạn đang đứng tại Đàn Nam Giao, một công trình kiến trúc tâm linh vô cùng quan trọng của triều Nguyễn. Nơi đây là đàn tế duy nhất còn được bảo tồn khá nguyên vẹn ở Việt Nam, nơi các vị vua triều Nguyễn đích thân tổ chức lễ tế trời đất vào mùa xuân để cầu mưa thuận gió hòa, quốc thái dân an. Đàn Nam Giao được thiết kế gồm ba tầng sân hướng về phía Nam, tượng trưng cho Thiên (Trời - hình tròn), Địa (Đất - hình vuông) và Nhân (Người). Đứng giữa không gian rộng lớn, bao quanh bởi rừng thông cổ thụ bạt ngàn, bạn sẽ cảm nhận được sự kết nối linh thiêng giữa con người và vũ trụ, và hiểu thêm về tín ngưỡng cung đình cũng như khát vọng hòa bình, thịnh vượng của người xưa.',0,0),('6adf5ff52219d18ee88b3d4d','Chùa Từ Hiếu','Di tích lịch sử','Chùa Từ Hiếu là một ngôi chùa cổ nổi tiếng tại Huế, nằm giữa không gian xanh yên tĩnh của vùng Thủy Xuân. Chùa có nguồn gốc từ am An Dưỡng do Hòa thượng Nhất Định lập vào năm 1843. Nơi đây nổi bật với kiến trúc truyền thống, hồ bán nguyệt, khu vườn tháp và khu nghĩa trang của các thái giám triều Nguyễn. Chùa Từ Hiếu là điểm đến mang giá trị lịch sử, văn hóa và tâm linh đặc sắc của cố đô Huế.','',16.43904,107.5723,'[\"/uploads/pois/15a5db43-087b-469c-8ea2-a9449307c4fa.jpg\"]',1,'2026-10-26 14:13:09.172000',100,'Chào mừng bạn đến với chùa Từ Hiếu, một trong những ngôi cổ tự độc đáo và mang đậm dấu ấn lịch sử nhất tại cố đô Huế. Ẩn mình giữa rừng thông xanh mát và tiếng suối róc rách, chùa Từ Hiếu không chỉ nổi tiếng bởi không gian thanh tịnh, mà còn bởi câu chuyện cảm động về lòng hiếu thảo của Thiền sư Nhất Định đối với mẹ già. Đặc biệt, đây còn là nơi an nghỉ của các vị thái giám triều Nguyễn – những người đã đóng góp xây dựng nên ngôi chùa để có nơi hương khói lúc cuối đời. Với kiến trúc hài hòa giữa đình chùa truyền thống và thiên nhiên hoang sơ, chùa Từ Hiếu mang đến cho du khách một cảm giác bình yên, sâu lắng, và là nơi thiền sư Thích Nhất Hạnh đã gắn bó trong những năm tháng cuối đời.',0,0);
/*!40000 ALTER TABLE `pois` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-11-11 22:54:02
SELECT * FROM POIS;
