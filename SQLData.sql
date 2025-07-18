
create database yasmeem_agricultural_company;
use yasmeem_agricultural_company;

create table Supplier (
	supplier_id int auto_increment primary key not null,
    first_name varchar(50),
    last_name varchar(50),
    phone_number int,
    email varchar(255),
    address varchar(50)
);
create table Warehouse (
	warehouse_id int auto_increment primary key not null,
    name varchar(100),
    phone_number int,
    address text,
    city varchar(100)
);
create table Product (
	product_id int auto_increment primary key not null,
	supplier_id int not null,
    category_id int not null,
	foreign key (supplier_id) references Supplier(supplier_id)
		on update cascade
		on delete cascade,
	foreign key (category_id) references Category(category_id)
		on update cascade
		on delete cascade,
    name varchar(50),
    price real,
    wholesale_price real,
    image text,
    description_product text,
    rate float,
    views_count int
);
create table Category(
	category_id int auto_increment primary key not null,
    category_name varchar(50),
    image text
);
create table Warehouse_Product(
	product_id int not null,
    warehouse_id int not null,
    total_stock_quantity int,
    foreign key (product_id) references Product(product_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    foreign key (warehouse_id) references Warehouse(warehouse_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    primary key (product_id,warehouse_id)
);
create table Offers(
	offers_id int auto_increment primary key not null,
    employee_id int not null,
	foreign key (employee_id) references Employee(employee_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    start_date date,
	end_date date,
    created_by varchar(50),
    status_offer ENUM('Active', 'Not-Active') DEFAULT 'Active',
    discount_percentage real,
    title varchar(50)
);
create table Product_Offers(
	product_id int not null,
    offers_id int not null,
    foreign key (product_id) references Product(product_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    foreign key (offers_id) references Offers(offers_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    primary key (product_id,offers_id)
);
create table Order_Table(
	order_id int auto_increment primary key not null,
    customer_id int not null,
    employee_id int ,
	foreign key (customer_id) references Customer(customer_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
	foreign key (employee_id) references employee(employee_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    order_date date,
	total_amount real,
    city varchar(50),
    street varchar(50),
    apt_number int,
    payment_method ENUM('visa', 'Pay on Delivery'),
	status_of_order ENUM('Accepted', 'Waiting', 'In_transit', 'Cancelled') DEFAULT 'Waiting'
);
create table Order_Details(
	product_id int not null,
    order_id int not null,
    foreign key (product_id) references Product(product_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    foreign key (order_id) references Order_Table(order_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    primary key (product_id,order_id),
    quantity int,
    added_at date
);
create table Branch(
	branch_id int auto_increment primary key not null,
    name varchar(100),
    address varchar(50),
    city varchar(100),
    street varchar(100),
    phone_number int
);
create table Branch_Product(
	product_id int not null,
    branch_id int not null,
    foreign key (product_id) references Product(product_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    foreign key (branch_id) references Branch(branch_id)		
        ON DELETE CASCADE
		ON UPDATE CASCADE,
    primary key (product_id,branch_id),
    total_stock_quantityt int
);
create table Visa_Table (
    visa_id int auto_increment primary key not null,
    visa_number VARCHAR(100) NOT NULL,
    visa_type VARCHAR(50) NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('Active', 'Expired', 'Cancelled') DEFAULT 'Active',
    customer_id INT,
    FOREIGN KEY (customer_id) REFERENCES customer(customer_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
create table Account_Table(
	account_id int not null Auto_increment primary key,
	first_name varchar(255),
	last_name varchar(255),
	email varchar(255) unique,
	phone_number varchar(10),
	account_type varchar(100),
	image text,
	date_of_birth date,
	password_hash text,
	created_at timestamp default current_timestamp,
	is_active ENUM('Active', 'Not-Active') DEFAULT 'Not-Active',
	gender varchar(50),
    city varchar(100),
    address text
);
create table Employee(
	employee_id INT AUTO_INCREMENT PRIMARY KEY,
	account_id INT UNIQUE, 
    branch_id int not null,
    manager_id int, 
	position VARCHAR(100),
	salary DECIMAL(10, 2),
	hire_date DATE,
	FOREIGN KEY (account_id) REFERENCES account_Table(account_id)
		ON DELETE CASCADE
		ON UPDATE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branch(branch_id)		
        ON DELETE CASCADE
		ON UPDATE CASCADE,
	FOREIGN KEY (manager_id) REFERENCES Employee(employee_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);
CREATE TABLE Customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT UNIQUE,
    registration_date DATE,
    FOREIGN KEY (account_id) REFERENCES Account_Table(account_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);
CREATE TABLE Product_Rating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    rating FLOAT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES Product(product_id) ON DELETE CASCADE
);
CREATE TABLE Cart (
  cart_id INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES Customer(customer_id)
  		ON DELETE CASCADE
		ON UPDATE CASCADE
);
CREATE TABLE Cart_Items (
	cart_item_id INT AUTO_INCREMENT PRIMARY KEY,
    cart_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cart_id) REFERENCES Cart(cart_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (product_id) REFERENCES Product(product_id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);



INSERT INTO Account_Table (
    first_name, last_name, email, phone_number, account_type, image, date_of_birth, password_hash, is_active, gender, city, address
) VALUES (
'Ali', 'Hassan', 'ali.hassan@example.com', '0599123456', 'Employee', 'ali.jpg', '1985-03-15', 'hashed_password_1', 'Active', 'Male', 'Ramallah', 'Bireh Street');


INSERT INTO Customer (account_id, registration_date)
VALUES (
    LAST_INSERT_ID(), -- Gets the account_id just inserted
    CURDATE()
);



INSERT INTO Category (category_name, image) VALUES
('Tillage Tools', 'https://i.postimg.cc/sG7dSGWr/Tillage-Tools.jpg'),
('Planting and Seeding Tools', 'https://i.postimg.cc/S2XpSvNj/Planting-and-Seeding-Tools.jpg'),
('Irrigation Tools', 'https://i.postimg.cc/CZxgtK3G/Irrigation-Tools.jpg'),
('Harvesting Tools', 'https://i.postimg.cc/Fd2X7V7p/Harvesting-Tools.jpg'),
('Pest and Disease Control Tools', 'https://i.postimg.cc/JsYWJLFP/Pest-and-Disease-Control-Tools.jpg'),
('Pruning and Trimming Tools', 'https://i.postimg.cc/MnDwdBFZ/Pruning-and-Trimming-Tools.jpg'),
('Material Handling Tools', 'https://i.postimg.cc/mt7B1J3H/Material-Handling-Tools.jpg'),
('Post-Harvest Processing Tools', 'https://i.postimg.cc/SJdPtY9D/post-harvest-processing-tools.jpg'),
('Livestock Management Tools', 'https://i.postimg.cc/HrLNGW4H/Livestock-Management-Tools.jpg'),
('Maintenance and Repair Tools', 'https://i.postimg.cc/V5rYmdd4/Maintenance-and-Repair-Tools.jpg');


INSERT INTO Supplier (first_name, last_name, phone_number, email, address) VALUES
('Ahmed', 'Mansour', 599123456, 'ahmed.mansour@example.com', '123 Main St, Ramallah'),
('Fatima', 'Khalil', 598765432, 'fatima.khalil@example.com', '456 Oak Ave, Nablus'),
('Omar', 'Saleh', 567112233, 'omar.saleh@example.com', '789 Pine Ln, Hebron'),
('Laila', 'Dawood', 592345678, 'laila.dawood@example.com', '101 Cedar Rd, Jenin'),
('Kamal', 'Hassan', 568987654, 'kamal.hassan@example.com', '202 Elm Blvd, Gaza');

-- Dummy data for Product (30 products, distributed across categories)
INSERT INTO Product (supplier_id, category_id, name, price, wholesale_price, image, description_product, rate, views_count) VALUES
-- Tillage Tools (Category ID 1)
(1, 1, 'Heavy Duty Plow', 1500.00, 1200.00, 'https://i.postimg.cc/CZ1FdVGs/Heavy-Duty-Plow.jpg', 'A robust plow designed for deep soil cultivation, enhancing soil aeration and preparing the land efficiently for planting. Ideal for tough soil conditions and large-scale farming.', 4.5, 120),
(1, 1, 'Disc Harrow', 2200.00, 1800.00, 'https://i.postimg.cc/RWGSM0H0/Disc-Harrow.jpg', 'Efficient tool for breaking up soil clods, leveling the field, and preparing seedbeds. Suitable for various soil types and helps improve soil texture for better crop growth.', 4.2, 90),
(2, 1, 'Rotary Tiller', 800.00, 650.00, 'https://i.postimg.cc/BjJZ9Fty/Rotary-Tiller.jpg', 'Perfect for quickly preparing seedbeds by loosening and mixing the soil, reducing labor and time. Compact and easy to maneuver, ideal for small to medium farms.', 4.7, 150),
-- Planting and Seeding Tools (Category ID 2)
(2, 2, 'Seed Planter', 350.00, 280.00, 'https://i.postimg.cc/3d5J1Vh3/Seed-Planter.jpg', 'Manual seed planter designed for small farms and gardens. Ensures consistent seed spacing and depth for optimal germination and growth.', 4.0, 75),
(3, 2, 'Precision Seeder', 1200.00, 1000.00, 'https://i.postimg.cc/qzsB5wBy/Precision-Seeder.png', 'Ensures accurate seed placement and uniform distribution for various crops, boosting yield and reducing seed wastage. Ideal for professional farmers seeking efficiency.', 4.8, 110),
(1, 2, 'Transplanter Machine', 950.00, 780.00, 'https://i.postimg.cc/p96PF1kb/Transplanter-Machine.avif', 'Automated transplanter designed to plant seedlings quickly and uniformly. Saves labor and increases transplanting speed, perfect for large-scale vegetable farms.', 4.3, 85),
-- Irrigation Tools (Category ID 3)
(3, 3, 'Drip Irrigation Kit', 250.00, 200.00, 'https://i.postimg.cc/vx98MLrR/Drip-Irrigation-Kit.jpg', 'Water-efficient drip system that delivers water directly to plant roots, minimizing waste. Suitable for gardens, greenhouses, and farms aiming for sustainable water use.', 4.6, 200),
(4, 3, 'Sprinkler System', 700.00, 580.00, 'https://i.postimg.cc/F1JHjm2P/Sprinkler-System.jpg', 'Large-area sprinkler system designed to evenly water fields, reducing labor and ensuring consistent moisture levels. Easy to install and maintain.', 4.1, 130),
(2, 3, 'Water Pump', 450.00, 370.00, 'https://i.postimg.cc/0Mh5LHJd/Water-Pump.jpg', 'High-capacity pump ideal for irrigation needs, capable of delivering strong and steady water flow. Durable design suitable for various water sources.', 4.4, 160),
-- Harvesting Tools (Category ID 4)
(4, 4, 'Hand Sickle', 25.00, 18.00, 'https://i.postimg.cc/Nyf0TXcT/Hand-Sickle.jpg', 'Traditional hand sickle for harvesting crops efficiently. Lightweight and easy to handle, perfect for small-scale farmers and gardeners.', 3.9, 50),
(1, 4, 'Combine Harvester (Mini)', 5000.00, 4200.00, 'https://i.postimg.cc/XrgJp8T4/Combine-Harvester-Mini.jpg', 'Compact yet powerful harvester designed for small to medium farms. Combines reaping, threshing, and cleaning, boosting productivity and saving labor.', 4.9, 180),
(5, 4, 'Fruit Picker', 50.00, 40.00, 'https://i.postimg.cc/RWmhS8pg/Fruit-Picker.jpg', 'Extendable tool for safely harvesting fruits from tall trees. Ergonomic design reduces strain and improves picking efficiency.', 4.2, 65),
-- Pest and Disease Control Tools (Category ID 5)
(5, 5, 'Backpack Sprayer', 120.00, 95.00, 'https://i.postimg.cc/F731Qmpf/Backpack-Sprayer.jpg', 'Manual backpack sprayer for applying pesticides and herbicides evenly. Adjustable nozzle and comfortable straps make it suitable for extended use.', 4.0, 100),
(3, 5, 'Fogging Machine', 850.00, 700.00, 'https://i.postimg.cc/jCGC9CH0/Fogging-Machine.jpg', 'Efficient fogging machine for pest control, ideal for large farms and greenhouses. Produces fine mist for thorough coverage and effective pest management.', 4.5, 95),
(4, 5, 'Insect Trap Kit', 30.00, 22.00, 'https://i.postimg.cc/CBRLrVdx/Insect-Trap-Kit.jpg', 'Eco-friendly insect traps designed to attract and capture harmful pests, reducing chemical use and protecting crops.', 3.8, 70),
-- Pruning and Trimming Tools (Category ID 6)
(1, 6, 'Pruning Shears', 40.00, 30.00, 'https://i.postimg.cc/67jphQWP/Pruning-Shears.jpg', 'High-quality pruning shears for precise and clean cuts. Essential for maintaining plant health and shaping shrubs and trees.', 4.7, 140),
(2, 6, 'Hedge Trimmer', 180.00, 145.00, 'https://i.postimg.cc/0r6bc7J0/Hedge-Trimmer.jpg', 'Electric trimmer designed for shaping hedges and bushes quickly and efficiently. Lightweight and easy to operate.', 4.3, 80),
(5, 6, 'Loppers', 60.00, 48.00, 'https://i.postimg.cc/SYzRRppv/Loppers.jpg', 'Long-handled loppers for cutting thicker branches with minimal effort. Durable construction ensures long-lasting performance.', 4.1, 70),
-- Material Handling Tools (Category ID 7)
(3, 7, 'Wheelbarrow (Heavy Duty)', 150.00, 120.00, 'https://i.postimg.cc/sBwv0ccw/Wheelbarrow-Heavy-Duty.jpg', 'Robust wheelbarrow designed for heavy-duty farm use. Large capacity and sturdy wheels make transporting materials easier and faster.', 4.6, 115),
(4, 7, 'Farm Trailer (Small)', 1800.00, 1500.00, 'https://i.postimg.cc/gwYxD5vx/Farm-Trailer-Small.jpg', 'Utility trailer ideal for transporting materials, tools, and produce. Compact size suitable for maneuvering in tight farm spaces.', 4.4, 90),
(1, 7, 'Manure Spreader', 2500.00, 2000.00, 'https://i.postimg.cc/1nXfxq7P/Manure-Spreader.jpg', 'Efficient manure spreader that distributes fertilizer evenly over fields, enhancing soil fertility and crop yield.', 4.0, 60),
-- Post-Harvest Processing Tools (Category ID 8)
(2, 8, 'Grain Cleaner', 1000.00, 850.00, 'https://i.postimg.cc/hX8JVg7F/Grain-Cleaner.jpg', 'Removes impurities and debris from harvested grains, improving quality and storage life. Easy to operate and clean.', 4.5, 75),
(5, 8, 'Vegetable Washer', 600.00, 500.00, 'https://i.postimg.cc/21Nbq3yF/Vegetable-Washer.jpg', 'Cleans fresh vegetables thoroughly with minimal water usage. Ideal for farms and markets ensuring produce hygiene.', 4.2, 65),
(3, 8, 'Fruit Grader', 1500.00, 1250.00, 'https://i.postimg.cc/nCD9cqFh/Fruit-Grader.jpg', 'Sorts fruits efficiently by size and quality, facilitating packaging and marketing. Durable build designed for high throughput.', 4.8, 88),
-- Livestock Management Tools (Category ID 9)
(1, 9, 'Automatic Feeder', 300.00, 250.00, 'https://i.postimg.cc/WFyts1xZ/Automatic-Feeder.jpg', 'Automated feeder providing regular and measured feed portions to livestock, improving feeding efficiency and reducing waste.', 4.3, 105),
(4, 9, 'Electric Fencing Kit', 400.00, 330.00, 'https://i.postimg.cc/8s3rSZVY/Electric-Fencing-Kit.jpg', 'Reliable electric fencing kit for secure containment of livestock, protecting them from predators and preventing escapes.', 4.1, 90),
(2, 9, 'Shearing Machine', 550.00, 450.00, 'https://i.postimg.cc/hhh76HNx/Shearing-Machine.jpg', 'Professional shearing machine designed for efficient and safe wool removal from sheep, reducing animal stress.', 4.6, 70),
-- Maintenance and Repair Tools (Category ID 10)
(5, 10, 'Tool Kit (Farm Specific)', 200.00, 160.00, 'https://i.postimg.cc/GTB8Dyvz/Tool-Kit-Farm-Specific.jpg', 'Comprehensive toolkit containing essential tools for maintenance and repair of farm equipment, ensuring operational efficiency.', 4.7, 130),
(3, 10, 'Grease Gun', 50.00, 40.00, 'https://i.postimg.cc/BL7PtgPX/Grease-Gun.jpg', 'Tool for lubricating machinery parts to prevent wear and extend equipment lifespan. Easy to use with precise application.', 4.0, 55),
(1, 10, 'Pressure Washer (Industrial)', 900.00, 750.00, 'https://i.postimg.cc/G8mscN2W/Pressure-Washer-Industrial.jpg', 'Heavy-duty cleaner designed to remove dirt, grime, and grease from farm equipment and buildings, boosting maintenance efficiency.', 4.9, 110);


-- Dummy data for Warehouse (at least 2 warehouses)
INSERT INTO Warehouse (name, phone_number, address, city) VALUES
('Main Agricultural Warehouse', 599111222, 'Industrial Zone, Beitunia', 'Ramallah'),
('Northern Farm Supply Depot', 598333444, 'Al-Balad Street, Jenin', 'Jenin');

-- Dummy data for Warehouse_Product (assign products to warehouses)
-- Assuming each product is in both warehouses with varying stock

INSERT INTO Warehouse_Product (product_id, warehouse_id, total_stock_quantity) VALUES
(1, 1, 10), (1, 2, 8),
(2, 1, 12), (2, 2, 7),
(3, 1, 15), (3, 2, 10),
(4, 1, 20), (4, 2, 15),
(5, 1, 8), (5, 2, 5),
(6, 1, 10), (6, 2, 6),
(7, 1, 30), (7, 2, 25),
(8, 1, 7), (8, 2, 4),
(9, 1, 18), (9, 2, 12),
(10, 1, 50), (10, 2, 40),
(11, 1, 3), (11, 2, 2),
(12, 1, 25), (12, 2, 20),
(13, 1, 35), (13, 2, 30),
(14, 1, 5), (14, 2, 3),
(15, 1, 40), (15, 2, 35),
(16, 1, 60), (16, 2, 50),
(17, 1, 15), (17, 2, 10),
(18, 1, 20), (18, 2, 18),
(19, 1, 28), (19, 2, 22),
(20, 1, 4), (20, 2, 3),
(21, 1, 6), (21, 2, 4),
(22, 1, 9), (22, 2, 7),
(23, 1, 12), (23, 2, 8),
(24, 1, 7), (24, 2, 5),
(25, 1, 10), (25, 2, 9),
(26, 1, 8), (26, 2, 6),
(27, 1, 5), (27, 2, 4),
(28, 1, 22), (28, 2, 18),
(29, 1, 30), (29, 2, 25),
(30, 1, 14), (30, 2, 11);

-- Dummy data for Branch (at least 2 branches)
INSERT INTO Branch (name, address, city, street, phone_number) VALUES
('Ramallah Main Branch', 'Al-Masyoun', 'Ramallah', 'Erbil Street', 599555666),
('Nablus Sales Office', 'Rafidia', 'Nablus', 'Main Street', 598777888);

-- Dummy data for Branch_Product (assign some products to branches)
-- Assume some products are available in branches for direct sale
INSERT INTO Branch_Product (product_id, branch_id, total_stock_quantityt) VALUES
(1, 1, 3), (2, 1, 5), (3, 1, 4),
(4, 2, 7), (5, 2, 2), (6, 2, 3),
(7, 1, 10), (8, 1, 2), (9, 1, 6),
(10, 2, 15), (11, 2, 1), (12, 2, 8),
(13, 1, 10), (14, 1, 1), (15, 1, 12),
(16, 2, 20), (17, 2, 5), (18, 2, 7),
(19, 1, 5), (20, 1, 1), (21, 1, 2);


-- Dummy data for Account_Table (for Employees and Customers)
INSERT INTO Account_Table (first_name, last_name, email, phone_number, account_type, image, date_of_birth, password_hash, is_active, gender, city, address) VALUES
('Sara', 'Mahmoud', 'sara.mahmoud@example.com', '0598765432', 'Employee', 'sara.jpg', '1990-07-22', 'hashed_password_2', 'Active', 'Female', 'Nablus', 'Old City'),
('Mazen', 'Darwish', 'mazen.darwish@example.com', '0567112233', 'Customer', 'mazen.jpg', '1978-11-01', 'hashed_password_3', 'Active', 'Male', 'Hebron', 'Ein Sara'),
('Nour', 'Abdullah', 'nour.abdullah@example.com', '0592345678', 'Customer', 'nour.jpg', '1995-02-28', 'hashed_password_4', 'Active', 'Female', 'Jenin', 'Khalil Street'),
('Khaled', 'Amer', 'khaled.amer@example.com', '0568987654', 'Customer', 'khaled.jpg', '1982-09-10', 'hashed_password_5', 'Active', 'Male', 'Ramallah', 'Masyoun Heights'),
('Rana', 'Ghazi', 'rana.ghazi@example.com', '0599121212', 'Employee', 'rana.jpg', '1988-04-05', 'hashed_password_6', 'Active', 'Female', 'Ramallah', 'Ramallah Road');

select * from Account_Table;
-- Dummy data for Employee
INSERT INTO Employee (account_id, branch_id, manager_id, position, salary, hire_date) VALUES
(1, 1, NULL, 'Manager', 2500.00, '2020-01-01'), -- Ali Hassan is a manager
(2, 2, 1, 'Sales Associate', 1200.00, '2021-06-10'),
(6, 1, 1, 'Warehouse Supervisor', 1800.00, '2019-09-20');

-- Dummy data for Customer
INSERT INTO Customer (account_id, registration_date) VALUES
(3, '2022-03-01'),
(4, '2023-01-15'),
(5, '2022-07-20');

-- Dummy data for Offers (some offers, not all products have offers)
INSERT INTO Offers (employee_id, start_date, end_date, created_by, status_offer, discount_percentage, title) VALUES
(1, '2025-06-01', '2025-06-30', 'Ali Hassan', 'Active', 15.0, 'Summer Harvesting Sale'),
(1, '2025-05-15', '2025-06-15', 'Ali Hassan', 'Active', 10.0, 'Irrigation System Discount'),
(2, '2025-07-01', '2025-07-31', 'Sara Mahmoud', 'Active', 20.0, 'Tillage Tools Bonanza'),
(3, '2025-01-01', '2025-03-31', 'Rana Ghazi', 'Not-Active', 5.0, 'Winter Clearance');

INSERT INTO Offers (employee_id, start_date, end_date, created_by, status_offer, discount_percentage, title) VALUES
(2, '2025-08-01', '2025-08-31', 'Sara Mahmoud', 'Active', 12.5, 'Harvest Season Promo'),
(1, '2025-09-01', '2025-09-30', 'Ali Hassan', 'Active', 8.0, 'Seed Sowing Essentials'),
(3, '2025-10-01', '2025-10-31', 'Rana Ghazi', 'Active', 18.0, 'Post-Harvest Equipment Sale'),
(1, '2025-11-01', '2025-11-15', 'Ahmed Farouk', 'Active', 25.0, 'Black Friday Farming Deals'),
(2, '2025-12-01', '2025-12-31', 'Sara Mahmoud', 'Not-Active', 10.0, 'Year-End Discount');

-- Dummy data for Product_Offers (assign some products to offers)
INSERT INTO Product_Offers (product_id, offers_id) VALUES
(11, 1), -- Combine Harvester (Mini) on Summer Harvesting Sale
(12, 1), -- Fruit Picker on Summer Harvesting Sale
(7, 2),  -- Drip Irrigation Kit on Irrigation System Discount
(8, 2),  -- Sprinkler System on Irrigation System Discount
(1, 3),  -- Heavy Duty Plow on Tillage Tools Bonanza
(2, 3),  -- Disc Harrow on Tillage Tools Bonanza
(3, 3);  -- Rotary Tiller on Tillage Tools Bonanza

INSERT INTO Product_Offers (product_id, offers_id) VALUES
(5, 4),  -- Seeder Machine on Black Friday Farming Deals
(6, 4),  -- Rotary Tiller on Black Friday Farming Deals
(9, 5),  -- Grain Moisture Meter on Year-End Discount
(10, 5), -- Soil Tester on Year-End Discount
(13, 6), -- Manual Weeder on Harvest Season Promo
(14, 6), -- Crop Cutter on Harvest Season Promo
(15, 7), -- Seed Drill on Seed Sowing Essentials
(16, 7), -- Planter Machine on Seed Sowing Essentials
(17, 8), -- Grain Storage Bin on Post-Harvest Equipment Sale
(18, 8); -- Bagging Machine on Post-Harvest Equipment Sale


INSERT INTO Order_Table (customer_id, employee_id, order_date, total_amount, city, street, apt_number, payment_method, status_of_order)
VALUES 
(1, 2, '2025-06-01', 120.50, 'New York', '5th Avenue', 101, 'visa', 'Accepted'),
(1, 3, '2025-06-02', 85.75, 'Los Angeles', 'Sunset Blvd', 202, 'Pay on Delivery', 'In_transit'),
(1, 1, '2025-06-03', 45.00, 'Chicago', 'Michigan Ave', 303, 'visa', 'Waiting'),
(1, NULL, '2025-06-04', 200.00, 'Houston', 'Main St', 404, 'Pay on Delivery', 'Cancelled');

INSERT INTO Order_Details (product_id, order_id, quantity, added_at)
VALUES 
(1, 1, 2, '2025-06-01'),
(2, 2, 1, '2025-06-01'),
(3, 3, 3, '2025-06-02'),
(4, 4, 1, '2025-06-03');
