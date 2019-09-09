/**	SQL Examples
	================================================
	Concatenate
		SQL		||
		MSSQL	+
		Excel	&
	================================================ */

/**	SQL Sampler
	================================================ */

	SELECT
		id,
		givenname,familyname,
		phone,
		height/2.54,				-- cm to inches
		format(height/2.54,'0.0')	-- cm to inches
	FROM customers
	WHERE state='vic'	--	check for CASE sensitivity
		AND dob IS NOT NULL
	-- ORDER BY familyname,givenname
	;

/**	Paging IN MSSQL
	================================================ */

	SELECT *  FROM
		(SELECT  ROW_NUMBER() OVER(ORDER BY id) AS row, * FROM prints) sq
	WHERE  row between 1 AND 10

/**	Contacts
	================================================ */

	DROP VIEW IF EXISTS contacts;
GO
	CREATE VIEW contacts AS	SELECT
		id,
--		email,
		CASE spam
			WHEN 1 THEN email
			WHEN 0 THEN ''
			ELSE email	--	evil
		END AS email,
		givenname+' '+familyname AS fullname,
		--	concat(givenname,' ',familyname) AS fullname,
		street,
		town+' '+state+' '+postcode AS locality,
		phone,
		coalesce(spam,0) AS newsletter
--		CASE spam WHEN 1 THEN 'Yes' ELSE '' END AS spam
	FROM customers
--	ORDER BY familyname,givenname OFFSET 0 rows
	;

/**	Price List
	================================================
	Using Sub Query
	================================================ */

	DROP VIEW IF EXISTS pricelist;
GO
	CREATE VIEW pricelist AS
	SELECT
		id,
		title,
		-- VLOOKUP(artistid,artists,[givenname],false) & " " & VLOOKUP(…)
		(SELECT givenname+' '+familyname FROM artists WHERE artists.id=paintings.artistid) AS artist,
		--	(SELECT coalesce(givenname+' '+familyname,'') FROM artists WHERE artists.id=paintings.artistid) AS artist,
		price, price*0.1 AS gst, price*1.1 AS total
	FROM paintings;

/**	Price List
	================================================
	Using JOIN
	================================================ */

	--	Inner JOIN
		SELECT
			p.id,p.title,
			a.givenname+' '+a.familyname AS artist,
			p.price, p.price*0.10 AS gst, p.price*1.10 AS total
		FROM paintings p JOIN artists a ON p.artistid=a.id;

	--	LEFT Child OUTER JOIN
		SELECT
			p.id,p.title,
			a.givenname+' '+a.familyname AS artist,
			p.price, p.price*0.10 AS gst, p.price*1.10 AS total
		FROM paintings p LEFT OUTER JOIN artists a ON p.artistid=a.id;

	--	RIGHT Child OUTER JOIN: Same AS above
		SELECT
			p.id,p.title,
			a.givenname+' '+a.familyname AS artist,
			p.price, p.price*0.10 AS gst, p.price*1.10 AS total
		FROM artists a RIGHT OUTER JOIN paintings p ON p.artistid=a.id;

	--	RIGHT Parent OUTER JOIN: Useful for Childless Parents
		SELECT
			p.id,p.title,
			a.givenname+' '+a.familyname AS artist,
			p.price, p.price*0.10 AS gst, p.price*1.10 AS total
		FROM paintings p RIGHT OUTER JOIN artists a ON p.artistid=a.id
		WHERE p.id IS NULL;

/**	SubQuery vs JOIN (vs VIEW)
	================================================ */

	SELECT
		id,title,
		(SELECT givenname+' '+familyname FROM artists WHERE artists.id=paintings.artistid) AS artist,
		price,price*0.10 AS gst,price*1.10 AS total
	FROM paintings;

	SELECT
		p.id,p.title,
		a.givenname+' '+a.familyname AS artist,
		p.price, p.price*0.10 AS gst, p.price*1.10 AS total
	FROM paintings p LEFT OUTER JOIN artists a ON p.artistid=a.id;

	SELECT * FROM pricelist;


/**	Customers & Artists
	================================================ */

	--	SELECT count(*) FROM saleitems;

	SELECT DISTINCT
		c.id, c.givenname, c.familyname,
		--	s.total,
		--	p.title,
		a.givenname+' '+a.familyname AS artist
	FROM
		customers c
			JOIN sales s ON c.id=s.customerid
				JOIN saleitems si ON s.id=si.saleid
					JOIN paintings p ON si.printid=p.id
						/* LEFT */ JOIN artists a ON p.artistid=a.id
	ORDER BY a.familyname,a.givenname;

	SELECT count(*) FROM saleitems;	--	compare number of results

	--	Duplicates
		WITH CTE AS (
			SELECT
				c.id,c.givenname,c.familyname,
				a.givenname+' '+a.familyname AS artist
			FROM
				customers c
					JOIN sales s ON c.id=s.customerid
						JOIN saleitems si ON s.id=si.saleid
							JOIN paintings p ON si.paintingid=p.id
								/* LEFT */ JOIN artists a ON p.artistid=a.id
		)
		SELECT
			id,givenname,familyname,artist,count(*) AS purchases
		FROM CTE
		GROUP BY id,givenname,familyname,artist
		HAVING count(*)>1;

/**	Aggregates
	================================================
	================================================ */

	--	Miscellaneous
		SELECT
			min(id),sum(id),avg(id),count(*),min(dob),count(height),
			sum(height)/count(height), avg(height), stdev(height), min(givenname)
		FROM customers;

	--	count(DISTINCT)
		SELECT count(DISTINCT customerid) FROM sales;
		SELECT count(DISTINCT state) FROM customers;

	--	avg(integer)
		SELECT
			count(*),count(quantity),avg(CAST(quantity AS decimal)),sum(price*quantity),count(DISTINCT saleid)
		FROM saleitems;

	--	avg(date)
		SELECT
			dateadd(day,-avg(datediff(day,dob,getdate())),getdate())
		FROM customers;

	--	Bad Examples
		SELECT sum(price), avg(price)
		FROM paintings;

	--	using an integer
		SELECT
			sum(quantity),
			avg(CAST(quantity AS decimal)),
			avg(CAST(quantity AS float)),
			sum(price*quantity),
			avg(price*quantity),
			min(price*quantity),
			max(price*quantity)
		FROM saleitems;

	--	Counting Nulls
		SELECT
			count(*)-count(description),
			count(CASE WHEN description IS NULL THEN 1 END)
		FROM paintings;

/**	GROUP BY
	================================================
	================================================ */

	--	Six Clauses
		--	CREATE VIEW populations AS
		SELECT town,state,count(*) AS population

		FROM customers
		WHERE dob<dateadd(year,-30,getdate())

		GROUP BY state,town
		HAVING count(*)>2

		--	SELECT town,state,count(*) AS population

		ORDER BY population DESC,state,town
		--	/* MSSQL>2008: */ OFFSET 0 rows
		;

	--	Double-Grouping

		SELECT datename(month,dob) AS month,count(*)
		FROM customers
		GROUP BY month(dob),datename(month,dob)
		ORDER BY month(dob);

/**	Filtered Aggregates
	================================================
	Filtered Aggregates are NOT (yet) widely supported.
	This can be emulated WITH the CASE operator.
	When using count, THEN 1 is arbitrary.
	================================================ */

	--	Count Spam
		SELECT
			count(*),
			--	count(spam) filter (WHERE spam=1),
			count(CASE WHEN spam=1 THEN 1 END) AS yes,
			count(CASE WHEN spam=0 THEN 1 END) AS no,
			count(CASE WHEN spam IS NULL THEN 1 END) AS dunno
		FROM customers;

	--	Age Groups
		SELECT
			count(CASE WHEN dob<'1990-01-01' THEN 1 END) AS older,
			count(CASE WHEN dob>='1990-01-01' THEN 1 END) AS younger,
			count(CASE WHEN dob IS NULL THEN 1 END) AS dunno
		FROM customers;


/**	Employees
	================================================
	================================================ */

	--	Add Employee
		INSERT INTO employees(givenname,familyname)
		VALUES('Mark','Something');
		--	“Accidentally” Run Again

	--	DELETE Second Instance
		DELETE FROM employees WHERE id=2;

	--	“Accidentally” UPDATE ALL
		UPDATE employees SET tfn='123456789';	--	OK ∵ tfn IS UNIQUE
		UPDATE employees SET familyname='Somethingue', phone='0370105678';	--	NOT OK

	--	UPDATE One Employee
		UPDATE employees SET tfn='123456789' WHERE id=1;

	--	Self JOIN
		SELECT
			e.id,e.givenname,e.familyname,
			coalesce(s.givenname+' '+s.familyname,'') AS supervisor
		FROM employees e LEFT JOIN employees AS s ON e.supervisorid=s.id;

/**	Sub Queries
	================================================
	Sub Queries are illustrated in separate sections.
	================================================ */

	--	IN(subquery): Big Spenders
		SELECT *
		FROM customers
		WHERE id IN(SELECT customerid FROM sales WHERE total>1800);

	--	IN(subquery): 17 Century Paintings
		SELECT *
		FROM paintings
		WHERE artistid IN(SELECT id FROM artists WHERE born>=1580 and born<= 1680);

	--	column=(subquery)
		SELECT *
		FROM customers
		WHERE dob=(SELECT min(dob) FROM customers)

/**	Copy Tables
	================================================
	================================================ */

	--	New Table
		SELECT *
		INTO temp
		FROM customers WHERE state='qld';

	--	Ditto, but doesn’t copy identity() property
		SELECT *
		INTO temp
		FROM customers WHERE state='qld'
		UNION SELECT * FROM customers WHERE state='qld';

	--	Existing Table
		INSERT INTO temp
		SELECT * FROM customers WHERE state='wa';

/**	Dates
	================================================
	Note the weakness IN the datediff() FUNCTION
	================================================ */

	--	Customer Age
		SELECT
			id,givenname,familyname,dob,datediff(year,dob,getdate())
		FROM customers;

	--	Outstanding Sales
		SELECT *
		FROM sales
		WHERE delivered IS NULL and ordered<dateadd(week,-2,getdate());

	--	Month
		SELECT
			id,givenname,familyname,dob,datename(month,dob) AS birthmonth
		FROM customers
		WHERE datepart(month,dob)<7
		ORDER BY month(dob);
	--	Age of Sale
		SELECT
			*,datediff(d,ordered,getdate()) age
		FROM sales
		WHERE delivered IS NULL and datediff(d,ordered,getdate())>10;

		SELECT *
		FROM (
			SELECT id, total, ordered, datediff(d,ordered,getdate()) age
			FROM sales
			WHERE delivered IS NULL
		) s
		WHERE age>10

/**	Unions
	================================================
	================================================ */

	--	Customers & Employees
		SELECT givenname, familyname, 'c' AS type FROM customers
		UNION -- ALL
		SELECT givenname, familyname, 'e' FROM employees;

	--	A Sort of Cross Tab
		SELECT
			id,title,
			CAST(price AS varchar) AS cheap,'' AS normal,'' AS pricey FROM paintings WHERE price<140
		UNION
		SELECT
			id,title,
			'' AS cheap, CAST(price AS varchar) AS normal,'' AS pricey FROM paintings WHERE price>=140 and price<180
		UNION
		SELECT
			id,title,
			'' AS cheap,'' AS normal,CAST(price AS varchar) AS pricey FROM paintings WHERE price>=180;


/**	DML
	================================================
	================================================ */

	INSERT INTO customers(givenname,familyname,email)
	VALUES('Mark','Something','mark@example.net');
	UPDATE customers SET phone='0370101234'
	WHERE email='mark@example.net';
	DELETE FROM customers
	WHERE email='mark@example.net';

/**	Table Subqueries & CTE
	================================================
	Used to USE aliases IN SELECT clause
	================================================ */

	--	Table Subquery

		SELECT id,title,price,gst
		FROM (SELECT *,price*0.1 AS gst FROM paintings) q
		WHERE gst<1.5;

	--	Common Table Expression
		WITH CTE AS (SELECT *,price*0.1 AS gst FROM paintings)
		SELECT id,title,price,gst
		FROM CTE
		WHERE gst<1.5;

/**	Function Sampler
	================================================
	Also includes CASE operator samples
	================================================ */
	SELECT
		id,
		left(givenname,1)+' '+familyname AS name,
		round(height/2.54,2) as "Height in Inches",
		upper(town) AS town,
		format(dob,'d MMM yyyy') AS dob,
		datediff(year,dob,getdate()) as age,
		datediff(year,dateadd(day,-datepart(dayofyear,dob)+1,dob),dateadd(day,-datepart(dayofyear,dob)+2,getdate())) AS "Real Age",
		left(phone,2)+' '+substring(phone,3,4)+' '+right(phone,4) AS phone,
		CASE spam
			WHEN 1 THEN 'yes'
			WHEN 0 THEN 'no'
			ELSE ''
		END AS "Unsolicited Unwelcome Junk Mail",
		CASE
			WHEN height<170 THEN 'petite'
			WHEN height>=170 THEN 'monstrous'
			ELSE ''
		END AS height
	FROM customers;
