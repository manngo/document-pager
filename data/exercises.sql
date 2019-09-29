/**	Database Design
	================================================
	================================================ */

/*	One to Many
	================================================
	See also: Price List
	================================================ */

/*	One to Maybe
	================================================
	================================================ */

/*	Associative Tables
	================================================
	================================================ */

	USE authorship;

	--	Expected Results
		SELECT count(*) FROM authorship;

	--	Authors & Books
		SELECT
			a.givenname,a.familyname,
			b.title
		FROM
			authors a
				JOIN authorship ab ON a.id=ab.authorid
					JOIN books b ON ab.bookid=b.id;

	--	Books & Authors
		SELECT
			b.title AS book,
			concat(a.givenname,' ',a.familyname) AS author
		FROM
			books b
				JOIN authorship ba ON b.id=ba.bookid
					JOIN authors a ON ba.authorid=a.id;

	--	Indexing
		DROP INDEX IF EXISTS ix_authorship_bookid ON authorship;
		DROP INDEX IF EXISTS ix_authorship_authorid ON authorship;

		CREATE INDEX ix_authorship_bookid ON authorship(bookid);
		CREATE INDEX ix_authorship_authorid ON authorship(authorid);

	--	Using Sub Queries: Not So Efficient for >1 Sub Query
		SELECT
			(SELECT title FROM books b WHERE b.id=ba.bookid) AS title,
			(SELECT givenname+' '+familyname FROM authors a WHERE a.id=ba.authorid) AS author
		FROM authorship ba;

	--	Using Join: More Efficient
		SELECT b.title,a.givenname+' '+a.familyname AS author
		FROM
			books b
				JOIN authorship ba ON b.id=ba.bookid
					JOIN authors a ON ba.authorid=a.id;

	--	Books Matching Genres
		--	Using Multiple Sub Queries
			SELECT
				bookid AS id,
				(SELECT title FROM books WHERE id=bookid) AS title
			FROM bookgenres
			WHERE genreid=(SELECT id FROM genres WHERE genre='historical');

		--	Ditto with Join
			SELECT b.id,b.title
			FROM
				books b
					JOIN bookgenres bg ON b.id=bg.bookid
						JOIN genres g ON bg.genreid=g.id
			WHERE genre='historical';

/**	Book Genres
	================================================
	================================================ */

	USE bookgenres;

	--	Books & Authors
		SELECT
			b.id, b.title,
			a.givenname+' '+a.familyname AS author
		FROM books b JOIN authors a ON b.authorid=a.id;

	--	Books & Genres
		SELECT *
		FROM books b
			JOIN bookgenres bg ON b.id=bg.bookid
				JOIN genres g ON bg.genreid=g.id;

	--	Select Genre
		SELECT b.id,b.title
		FROM
			books b
				JOIN bookgenres bg ON b.id=bg.bookid
					JOIN genres g ON bg.genreid=g.id
		WHERE genre='historical';

		SELECT bookid AS id,(SELECT title FROM books WHERE id=bookid) AS title
		FROM bookgenres
		WHERE genreid=(SELECT id FROM genres WHERE genre='historical');


/**	Altering Tables
	================================================
	================================================ */

	--	Computed Columns

	--	Indexes

	--	Check Constraint

/*	zary Tables
	================================================
	SELECT … INTO also copies the IDENTITY property
	================================================ */
	USE printsdb;

	--	Create table from customers
		SELECT id,givenname,familyname,email
		INTO #qld
		FROM customers
		WHERE state='qld';

	--	Now that #qld exists, need to write into IDENTITY column
		SET identity_insert #qld ON;
		INSERT INTO #qld(id,givenname,familyname,email)
		SELECT id,givenname,familyname,email FROM customers WHERE state='tas';
		SET identity_insert #qld off;

	--	Not needed next session:
		DROP TABLE IF EXISTS #qld;

/**	Database Integrity & Efficiency
	================================================
	================================================ */

/*	Indexes
	================================================
	create table indexed (
		id int identity(1,1) primary key,
		authorid int,
		title nvarchar(255),
		published int
	);
	create index ix_indexed_title on indexed(title);

	create table unindexed (
		id int identity(1,1) primary key,
		authorid int,
		title nvarchar(255),
		published int
	);

	--	Do This a few times:
		insert into indexed(authorid,title,published)
		select authorid,title,published from books;

	--	Copy into the other table:
		insert into unindexed(authorid,title,published)
		select authorid,title,published from indexed;
	================================================ */

	--	Standard
		USE bookgenres;

		SELECT * INTO TEMP indexed FROM books;
		SELECT * INTO TEMP unindexed FROM books;

	--	CREATE INDEX ix_indexed_title ON indexed(title);
		CREATE INDEX indexed_title ON indexed(title);

		SELECT * FROM indexed WHERE title='A Christmas Carol';
		SELECT * FROM unindexed WHERE title='A Christmas Carol';

	--	MSSQL
		USE bookgenres;

		SELECT * INTO #indexed FROM books;
		SELECT * INTO #unindexed FROM books;

		CREATE INDEX ix_indexed_title ON #indexed(title);

		SELECT * FROM #indexed WHERE title='A Christmas Carol';
		SELECT * FROM #unindexed WHERE title='A Christmas Carol';

	--	Same Table
		--	Copy title into new column
			ALTER TABLE books ADD name varchar(256);
			UPDATE books SET name=title;
		--	Index Title Only
			CREATE INDEX idx_book_title ON books(title);
		--	Compare:
			SELECT * FROM books WHERE name='Dracula';
			SELECT * FROM books WHERE title='Dracula';

/*	Unique Index
	================================================ */

	USE employees;

	--	Post Hoc
		--	Unique
			CREATE UNIQUE INDEX uq_customers_phone ON customers(phone);
		--	MSSQL Requires Conditional Constraint
			CREATE UNIQUE INDEX uq_customers_phone ON customers(phone)
			WHERE phone IS NOT NULL;

/*	Other Constraints
	================================================
	================================================ */

	--	Primary Key
		ALTER TABLE #archive
		ADD primary key(id);

	--	Default
		ALTER TABLE saleitems add DEFAULT 1 for quantity;
		--	INSERT INTO saleitems(…,quantity) VALUES(…,DEFAULT);

	--	Check
		ALTER TABLE saleitems
		ADD CHECK (quantity>1);

		ALTER TABLE customers
		ADD CHECK (postcode LIKE '[0-9][0-9][0-9][0-9]');

		CREATE TABLE people (
			id int identity(1,1) primary key,
			givenname varchar(24) NOT NULL,
			familyname varchar(24) CHECK(len(familyname)>1),
			state varchar(3) DEFAULT 'vic' CHECK (state IN ('vic','nsw','qld')),
			CHECK (start<=finish)
		);


/**	DML
	================================================
	================================================ */

	INSERT INTO customers(givenname,familyname,email)
	VALUES('…','…','…');

	--	SELECT scope_identity();

	UPDATE customers
	SET phone='…'
	WHERE email='…';

/*	Set Operation
	================================================
	================================================ */

	USE printsDB;

	--	UNION
		SELECT givenname,familyname,'c' AS type FROM customers
		UNION /* ALL */
		SELECT givenname,familyname,'a' FROM artists
		ORDER BY familyname,givenname;

	--	INTERSECT
		SELECT id,givenname,familyname FROM customers WHERE state='vic'
		INTERSECT
		SELECT id,givenname,familyname FROM customers WHERE dob<'1980-01-01'
		ORDER BY familyname,givenname;

	--	EXCEPT (MINUS)

/*	Copy Table
	================================================
	================================================ */

	--	SELECT … INTO [new table]
		DROP TABLE IF EXISTS #temp;
		SELECT
			id,givenname+' '+familyname AS name
		INTO #temp
		FROM customers
		--	WHERE STATE='NSW'
		;

	--	INSERT INTO [existing table] SELECT …
		DROP TABLE IF EXISTS #temp;

		CREATE TABLE #temp (
			id int primary key,
			name nvarchar(255)
		);

		INSERT INTO #temp(id,name)
		SELECT id,givenname+' '+familyname FROM customers WHERE state='vic'

/*	: Archive
	================================================
	Using Temporary Tables for Example
	1	Copy First Archive Rows
		This also copies the IDENTITY attribute,
		but NOT the Primary Key
	2	Create Primary Key
	3	Delete from Original
	4	Copy Next Archive Rows
		Because of the IDENTITY attribute, need to SET IDENTITY_INSERT
	5	Delete from Original
	…	Repeat 4 & 5 Ad Nauseum
	================================================ */

	USE bookgenres;

	--	Preliminaries
		DROP TABLE IF EXISTS #tempbooks;
		DROP TABLE IF EXISTS #archive;

		SELECT id,authorid,title,published
		INTO #tempbooks
		FROM books;

	--	1	Archive <1700
		SELECT id,authorid,title,published
		INTO #archive
		FROM #tempbooks
		WHERE published<1700;

	--	2	Primary Key
		ALTER TABLE #archive
		ADD primary key(id);

	--	3	Delete Originals
		DELETE FROM #tempbooks
		WHERE id IN (SELECT id FROM #archive);

	--	4	Archive <1800
		SET IDENTITY_INSERT #archive ON;
			INSERT INTO #archive(id,authorid,title,published)
			SELECT id,authorid,title,published
			FROM #tempbooks WHERE published<1800;
		SET IDENTITY_INSERT #archive OFF;

	--	5	Delete Originals
		DELETE FROM #tempbooks
		WHERE id IN (SELECT id FROM #archive);


/*	Inserting INTO Related Table
    ================================================
    Method:
	-	Add a row INTO the sales table
	-	Get the new Primary Key
	-	Add rows INTO the saleitems table,
		using this retrieved primary key AS the foreign key
    -	UPDATE the sales table WITH the total FROM the saleitems rows.
	Illustrates:
		Related Records
		Getting ID
		Transaction
		Sub Queries
		--	DECLARE @paintings TABLE(id int, quantity int);
    ================================================ */

	USE printsDB;

	--	To illustrate this, get 1 random customer & 3 random paintings
		--	SELECT top (1) * FROM customers ORDER BY newid();
		--	SELECT top (3) * FROM paintings ORDER BY newid();

	--	Test Data
		--	Random Customer
			DECLARE @customerid int=(SELECT top (1) id FROM customers ORDER BY newid());
		--	Random Paintings
			DECLARE @painting1 int=(SELECT top (1) id FROM paintings ORDER BY newid());
			DECLARE @painting2 int=(SELECT top (1) id FROM paintings ORDER BY newid());
			DECLARE @painting2 int=(SELECT top (1) id FROM paintings ORDER BY newid());
		--	Random Quantities
			DECLARE @quantity1 int=abs(checksum(NewId()))%4+1
			DECLARE @quantity2 int=abs(checksum(NewId()))%4+1
			DECLARE @quantity3 int=abs(checksum(NewId()))%4+1

	--	Variable for Primary Key
		DECLARE @saleid int;

	--	Transaction
		BEGIN TRANSACTION;

	--	INSERT New Sale
		INSERT INTO sales(customerid,ordered)
		VALUES(…,getdate());

		--	Random Example
			INSERT INTO sales(customerid,ordered)
			VALUES(@customerid,getdate());

	--	Fetch Primary Key INTO Variable
		SET @saleid=scope_identity();

	--	Sample SELECT statement to get Price
		--	SELECT price FROM paintings WHERE id=…;

	--	INSERT Sale Items
		INSERT INTO saleitems(saleid,paintingid,quantity,price)
		VALUES
			(@saleid,@painting1,@quantity1,(SELECT price FROM paintings WHERE id=@painting1)),
			(@saleid,@painting2,@quantity2,(SELECT price FROM paintings WHERE id=@painting2)),
			(@saleid,@painting3,@quantity3,(SELECT price FROM paintings WHERE id=@painting3));

	--	Sample SELECT Statement to get new Total:
		SELECT sum(price*quantity)
		FROM saleitems
		WHERE saleid=@saleid;

	--	UPDATE Total IN Sales
		UPDATE sales
		SET total=(SELECT sum(price*quantity) FROM saleitems WHERE saleid=@saleid)
		WHERE id=@saleid;

	--	End Transaction
		COMMIT;

/**	Calculating
    ================================================
    ================================================ */

	--	Approximation Functions
		DECLARE @value decimal(8,4)=123.4567;
		SELECT
			ceiling(@value) AS ceiling,
			floor(@value) AS floor,
			round(@value,0) AS round0,
			round(@value,1) AS round1,
			round(@value,2) AS round2,
			round(@value,3) AS round3;


/*	SELECT
    ================================================
    ================================================ */

/*	WHERE
    ================================================
    ================================================ */

/*	ORDER BY
    ================================================
    ================================================ */

/*	Variables
    ================================================
    ================================================ */

	DECLARE @tax AS decimal(3,2)=0.2;
	SELECT
		id,title,
		price,price*@tax AS gst,price*(1+@tax) AS total
	FROM paintings;

/*	Functions
	================================================ */

	--	SQL Server: Format
		SELECT
			format(getdate(),'d MMM yyyy'),
			format(1.45,'0.0'),
			format(12345,'0,000,000');

	--	SQL Server: Replace
		DECLARE @name varchar(60)='Stan, the Man,Lee';
		SELECT replace(@name,',',' ');

/*	Cast
	================================================ */

	USE bookgenres;
	SELECT
		id,
		title + ' (' + CAST(published AS char) + ')'
	FROM books;


	USE printsdb;

	SELECT
		id,title,
		price, CAST(price/100 AS decimal(3,2))
	FROM paintings;

	--	Alternative to casting integer

		SELECT avg(cast(quantity AS decimal)) FROM saleitems;
		SELECT avg(quantity*1.0) FROM saleitems;

		SELECT 200/7.0;

	--	Combined WITH coalesce
		SELECT
			id,
			givenname+' '+familyname+coalesce(': '+CAST(height AS varchar),'')
		 FROM customers;

/*	CASE
 	================================================ */

/**	Case Operator
    ================================================
	See also:
		Pivot Tables
		Order By Case
    ================================================ */
	--	Pricing
		SELECT
			id,title,
			CASE
				WHEN price>180 THEN 'expensive'
				WHEN price>140 THEN 'reasonable'
				ELSE 'cheap'
			END AS price
		FROM paintings;

	--	Customer Details
		SELECT
			id,givenname,familyname,
			--	Age
				CASE
					WHEN dob<'1970-01-01' THEN 'old'
					WHEN dob<'1990-01-01' THEN 'medium'
					ELSE 'young'
				END AS age,
			--	Region
				CASE
					WHEN state IN('qld','nsw','vic','tas') THEN 'East'
					WHEN state IN ('nt','sa') THEN 'Central'
					ELSE 'Elsewhere'
				END AS region,
				CASE state
					WHEN 'vic' THEN 'home'
					WHEN 'act' THEN 'hell'
					ELSE 'somewhere'
				END AS location,
			--	Spam
				CASE spam
					WHEN 1 THEN email
					WHEN 0 THEN	'No way'
					ELSE 'ummm'
				END AS spam,	--	can use column name as alias
			--	Selective Email Address
				CASE spam				--	CASE value WHEN
					WHEN 1 THEN email
					WHEN 0 THEN ''
					ELSE ''
				END AS email,
				CASE					--	CASE WHEN
					WHEN spam=1 THEN email
					WHEN spam=0 THEN ''
					ELSE ''
				END AS "Alternative Email",
			--	Summarised Heights
					CASE
						WHEN height>170 THEN 'tall'
						WHEN height<=170 THEN 'short'
						ELSE ''
					END AS height,	--	can reuse column name
			--	More Complex Condition
				CASE
					WHEN height<170 and state='nsw' THEN 'short'
					WHEN height>=170 THEN 'tall'
					ELSE ''
				END AS height
		FROM customers;

/*	Coalesce
	================================================
	coalesce(price,0)
	coalesce(quantity,0)
	coalesce(contact.company_name,contact.personal_name)
	================================================ */

	--	Blank Out Nulls
		SELECT
			id,
			givenname+' '+familyname AS name,
			coalesce(CAST(height AS varchar),'') AS height
		FROM customers;

/**	Creating & USING Views
    ================================================
	See also Essentials
	NB:	SQL Server disallows ORDER BY unless
		followed by OFFSET 0 ROWS
    ================================================ */

/*	Computed Columns
    ================================================
    ================================================ */

	USE printsDB;

	ALTER TABLE customers
	DROP column IF EXISTS fullname;
	ALTER TABLE customers
	ADD fullname AS givenname + ' ' + familyname persisted;
	UPDATE customers SET fullname='whatever' WHERE id=1;	--	Error

/**	Aggregating Data
    ================================================
    ================================================ */

	USE printsDB;

/*	Some Aggregate Examples
    ================================================
	These are variations ON simple aggregate functions:
    ================================================ */

	--	count(DISTINCT)
		SELECT count(DISTINCT state) FROM customers;

	--	Total Using coalesce(value,average)
		--	Hard-Coded
			SELECT sum(coalesce(height,170)) FROM customers;
		--	Calculated (NOT MSSQL, of course)
			SELECT sum(coalesce(height,(SELECT avg(height) FROM customers))) FROM customers;
		--	For MSSQL, you need to calculate the average separately, and cross-JOIN WITH customers
			SELECT sum(coalesce(height,average_height))
			FROM customers,(SELECT avg(height) AS average_height FROM customers) sq;
			--	or
			WITH aggregates AS (SELECT avg(height) AS average_height FROM customers)
			SELECT sum(coalesce(height,average_height)) FROM customers,aggregates;

	--	WHERE (aggregate)
		SELECT *
		FROM customers
		WHERE dob=(SELECT min(dob) FROM customers);

	--	coalesce(aggregate)
		SELECT
			id,
			givenname+' '+familyname AS name,
			coalesce(height,(SELECT avg(height) FROM customers)) AS height
		FROM customers;

	--	In Sub Query
		SELECT *
		FROM customers
		WHERE height<(SELECT avg(height) FROM customers);

	--	Average Age
		SELECT avg(datediff(year,dob,getdate())) FROM customers;
		SELECT
			id,givenname,familyname,
			coalesce(datediff(year,dob,getdate()),(SELECT avg(datediff(year,dob,getdate())) FROM customers)) AS age
		FROM customers;

	--	Aggregate Filter
		SELECT
			id,givenname,familyname,height,
			CASE WHEN height<170 THEN 1 END AS short,
			CASE WHEN height>=170 THEN 1 END AS tall
		FROM customers;


		SELECT
			count(*) AS population,
			count(CASE WHEN height<170 THEN 1 END) AS short,
			count(CASE WHEN height>=170 THEN 1 END) AS tall
		FROM customers;

/*	Groups
    ================================================
    ================================================ */

	USE printsDB;

--	Basic Example
	SELECT town,state,count(*) AS population
	FROM customers
	WHERE dob<'1980-01-01'
	GROUP BY state,town
	HAVING count(*)>2
	--	SELECT town,state,count(*) AS population
	ORDER BY population DESC,state,town;

/*	:GROUP BY calculation
	================================================ */

	USE printsDB;
	SELECT
		datename(month,dob) AS month,count(*) AS population
	FROM customers
	GROUP BY datename(month,dob),month(dob)
	ORDER BY month(dob);

	WITH cte AS(
		SELECT
			CASE
				WHEN dob<'1950-01-01' THEN '1940s'
				WHEN dob<'1960-01-01' THEN '1950s'
				WHEN dob<'1970-01-01' THEN '1960s'
				WHEN dob<'1980-01-01' THEN '1970s'
				WHEN dob<'1990-01-01' THEN '1980s'
				WHEN dob<'2000-01-01' THEN '1990s'
				ELSE 'unknown'
			END AS decade,
			*
		FROM customers
		--	WHERE dob IS NOT NULL
	)
	SELECT decade,count(*)
	FROM cte
	GROUP BY decade;

/*	: GROUP BY month
	================================================
	To display the month name and ORDER BY month number
	we need to GROUP BY month twice.
	This gets more difficult IF we want to ORDER BY
	something ELSE.
	================================================ */

	USE printsDB;

	SELECT datename(month,dob), count(*)
	FROM customers
	WHERE dob IS NOT NULL
	--WHERE month(dob)=month(dateadd(month,1,getdate()))
	GROUP BY datename(month,dob), datepart(month,dob)
	ORDER BY datepart(month,dob);

/*	: 	GROUP BY Aggregates
    ================================================
    ================================================ */
--	GROUP BY Aggregates
	--	Basic: Requires Repeating the Calculation
		SELECT
			CASE
				WHEN dob<'1980-01-01' THEN 'older'
				WHEN dob>='1980-01-01' THEN 'younger'
			END AS age,
			count(*)
		FROM customers
		GROUP BY
			CASE
				WHEN dob<'1980-01-01' THEN 'older'
				WHEN dob>='1980-01-01' THEN 'younger'
			END;
	--	Using a Sub Query
		SELECT
			age,count(*)
		FROM (SELECT
			*,
			CASE
				WHEN dob<'1980-01-01' THEN 'older'
				WHEN dob>='1980-01-01' THEN 'younger'
			END AS age
		FROM customers) sq
		GROUP BY age;
	--	Common Table Expression
		WITH cte AS (
			SELECT
				*,
				CASE
					WHEN dob<'1980-01-01' THEN 'older'
					WHEN dob>='1980-01-01' THEN 'younger'
				END AS age
			FROM customers
		)
		SELECT age,count(*)
		FROM cte
		GROUP BY age;

/*	Group Concatenation
    ================================================
	Standard:
		string_agg(data,delimiter) AS data
	Some Others:
		group_concat(data,delimiter) AS data
	MSSQL<2017
		substring((SELECT concat(',',data) FROM table t WHERE t.group=table.group FOR XML PATH('')),2,@@textsize) AS data
		stuff((SELECT concat(';',data) FROM table t WHERE t.group=table.group FOR XML PATH('')),1,1,'') AS data
    ================================================ */

	--	Standard: NOT MSSQL<2017
		SELECT
			artistid,
			string_agg(CAST(id AS varchar),';') AS works	--	group_concat IN MySQL
		FROM paintings
		GROUP BY artistid
		ORDER BY artistid;

	--	Convoluted: MSSQL<2017
		--	Uses: (SELECT concat(delimiter,column) FROM table t WHERE t.column=table.column FOR XML PATH(''))
		SELECT
			artistid,
			substring((SELECT concat(';',id) FROM paintings p WHERE p.artistid=paintings.artistid FOR XML PATH('')),2,@@textsize) AS works,
			--	stuff((SELECT concat(';',id) FROM paintings p WHERE p.artistid=paintings.artistid FOR XML PATH('')),1,1,'') AS works
		FROM paintings
		GROUP BY artistid
		ORDER BY artistid;

	--	Combined with JOIN
		WITH cte AS (
			SELECT
				b.title,
				a.givenname+' '+a.familyname AS author
			FROM
				books b
					JOIN authorship AS ba ON b.id=ba.bookid
						JOIN authors a ON ba.authorid=a.id
		)
		SELECT
			title,
			substring((SELECT concat(', ',author) FROM cte ba WHERE ba.title=cte.title FOR XML PATH('')),3,@@textsize) AS author
		FROM cte
		GROUP BY title;

	--	The above CTE could also have been a VIEW

/*	Agregate Filter
    ================================================
    ================================================ */

	--	Standard
		SELECT
			count(*) FILTER (WHERE spam) AS yes,			--	spam=true
			count(*) FILTER (WHERE NOT spam) AS no,			--	spam=false
			count(*) FILTER (WHERE spam IS NULL) AS dunno
		FROM customers;

	--	Alternative
		SELECT
			count(CASE WHEN spam=1 THEN 1 END) AS yes,
			count(CASE WHEN spam=0 THEN 1 END) AS no,
			count(CASE WHEN spam IS NULL THEN 1 END) AS dunno
		FROM customers;

/**	Grouping Sets & Rollup
	================================================
	================================================ */

	USE printsdb;

	--	Manual
		SELECT 0 AS level,town,state,count(*) AS population
		FROM customers GROUP BY state,town
		UNION
		SELECT 1,NULL,state,count(*)
		FROM customers GROUP BY state
		ORDER BY state,level,town;
	--	GROUPING SETS
		SELECT COALESCE(town,'Total for'),coalesce(state,'ALL'),count(*) AS population
		--	SELECT coalesce(state,'Grand'),coalesce(town,'Total'),count(*) AS population
		FROM customers
		GROUP BY GROUPING SETS((state,town),(state),());

	--	ROLLUP
		SELECT
			coalesce(state,'Grand') AS state,
			coalesce(town,'Total') AS town,
			count(*) AS population
		FROM customers
		GROUP BY ROLLUP(state,town);

/**	Window Functions
	================================================ */

/*	Aggregate Examples
	================================================
	================================================ */

	--	Group State Totals
		SELECT
			id,state,
			count(*) over (PARTITION by state) AS "State Total",
			count(*) OVER (PARTITION BY state,town) AS "Town Total",
			height - avg(height) OVER (PARTITION BY state,town) AS "Height from Average",
			sum(height) OVER (PARTITION BY state,town) "Town Heights"
		FROM customers;

	--	Running Height Total
		SELECT
			id, email, sum(height) over (ORDER BY id DESC)
		FROM customers
		ORDER BY id;

	--	Running (Group) Totals
		SELECT
			*,
			sum(total) over(PARTITION by ordered ORDER BY id),
			count(total) over(ORDER BY ordered)
		FROM sales
		ORDER BY ordered,id;

	--	Different Totals

		SELECT
			*,
			sum(total) OVER (PARTITION BY ordered) AS date_total,
			sum(total) OVER (ORDER BY ordered,id) AS "Running Total",
			sum(total) OVER(PARTITION BY ordered ORDER BY ordered,id) AS "Group Running Total",
			avg(total) OVER (ORDER BY ordered,id) AS "Running Average"
		FROM sales
		ORDER BY ordered,id;

/**	Window Functions: Position
    ================================================
	row_number	one behind the other
	rank		equal are side-by-side: item number
	dense_rank	equal are side-by-side: position number
    ================================================ */

	USE printsDB;
	SELECT
		--	Basic Stuff
			id,givenname,familyname,dob,
		--	Position
			row_number() over (ORDER BY dob) AS rownumber,
			rank() over (ORDER BY dob) AS rank,
			dense_rank() over (ORDER BY dob) AS dense_rank,
			ntile(10) over (ORDER BY dob) AS decile,
		--	Differential
			lag(dob) over (ORDER BY dob) AS previous,
			lead(dob) over (ORDER BY dob) AS next,
			datediff(day,lag(dob) over (ORDER BY dob),dob) AS difference
	FROM customers
	WHERE dob IS NOT NULL
	ORDER BY dob;

	--	Group Line Numbers
		SELECT
			id,email,state,
			row_number() OVER(PARTITION BY state ORDER BY state) AS row
		FROM customers
		ORDER BY state,familyname,givenname;

	--	Using Lead (or Lag)
		SELECT
			id,email,height,
			lead(height,1) OVER(ORDER BY height) AS "Next Height",
			lead(height,1) OVER(ORDER BY height) - height AS "Height Difference"
		FROM customers
		ORDER BY height;

		SELECT
			id,email,dob,
			datediff(day,dob,lag(dob,1) OVER (ORDER BY dob)) "Age Difference"
		FROM customers
		ORDER BY dob;

/**	Window Functions: Sales
	================================================
	================================================ */

	--	Position
		SELECT
			*,
			row_number() over (ORDER BY ordered),
			rank() over (ORDER BY ordered),
			dense_rank() over (ORDER BY ordered)
		FROM sales
		ORDER BY ordered,id;

	--	Running Totals

		SELECT
			*,
			row_number() OVER (ORDER BY ordered,id) AS item,
			row_number() OVER (PARTITION BY ordered ORDER BY ordered,id) AS daily_item,
			--	Party Trick: Show Date for First Item  Only
			CASE
				WHEN row_number() OVER (PARTITION BY ordered ORDER BY ordered,id)=1
					THEN format(ordered, 'd MMM yyyy') -- CAST(ordered AS varchar)
				ELSE ''
			END AS date,
			sum(total) OVER (ORDER BY ordered,id) AS running_total,
			sum(total) OVER (PARTITION BY ordered) AS daily_total,
			sum(total) OVER (PARTITION BY ordered ORDER BY ordered,id) AS daily_running_total
		FROM sales;

/**	Window Functions: Paging
    ================================================
	================================================ */

	USE printsdb;

	--	MSSQL
		SELECT top 5 *
		FROM paintings
		ORDER BY price DESC;

	--	Row Number Using Sub Query
		SELECT *
		FROM (
			SELECT id,email,row_number() over(ORDER BY dob) AS row
			FROM customers
		) sq
		WHERE row between 6 and 10;

	--	Row Number Using CTE
		WITH cte AS (
			SELECT id,email,row_number() over(ORDER BY dob) AS row
			FROM customers
		)
		SELECT *
		FROM cte
		--WHERE row%2=0	--	Even Rows
		WHERE row between 6 and 10;

	--	OFFSET … FETCH
		SELECT *
		FROM customers
		ORDER BY dob OFFSET 5 rows FETCH FIRST /* | NEXT */ 5 ROWS ONLY;


/*	Using Variables
	================================================
	See Also Functions & Procedures
	================================================ */
	DECLARE @page int=2;
	DECLARE @size int=13;

	WITH cte AS (
		SELECT *,row_number() over (ORDER BY id) AS row
		FROM customers
	)
	SELECT *
	FROM cte
	WHERE row between (@page-1)*@size+1 and @page*@size;

/**	Sub Queries
	================================================
	See also:
		Price List
		Oldest Customer
	================================================ */

/*	in WHERE clause
	================================================ */
	SELECT
		*
	FROM customers
	WHERE height<(SELECT avg(height) FROM customers);

	SELECT *
	FROM sales
	WHERE customerid IN (SELECT id FROM customers WHERE state='nsw');

/*	Find Duplicates
	================================================ */

	SELECT *
	FROM customers
	WHERE phone IN (
		SELECT phone
		FROM customers
		GROUP BY phone
		HAVING count(*)>1
	);

/**	Sub Queries or CTE to use SELECT values
	================================================
	================================================ */

	--	Without
		SELECT
			id,
			givenname, familyname,
			dob,
			month(dob) AS birthmonth,
			datename(month,dob) AS monthname
		FROM customers
		WHERE datename(month,dob)='January';

	--	Sub Query
		SELECT *
		FROM (SELECT
			id,
			givenname, familyname,
			dob,
			month(dob) AS birthmonth,
			datename(month,dob) AS monthname
		FROM customers) sq
		WHERE monthname='January';

	--	CTE
		WITH cte AS (SELECT
			id,
			givenname, familyname,
			dob,
			month(dob) AS birthmonth,
			datename(month,dob) AS monthname
		FROM customers)
		SELECT *
		FROM cte
		WHERE monthname='January'

/*	Recursive CTE
    ================================================
    ================================================ */

	USE employees;

	--	Single-Level Hierarchy
		SELECT
			e.id,e.givenname,e.familyname,
			s.givenname,s.familyname
		FROM employees e LEFT JOIN employees s ON e.supervisorid=s.id;

	--	Multi-Level Hierarchy using Recursive CTE
		WITH cte AS (
			SELECT	--	anchor member
				id,givenname,familyname,supervisorid, -- NULL
				CAST(concat(givenname,' ',familyname) AS varchar(max)) AS name
			FROM employees WHERE supervisorid IS NULL

			UNION ALL

			SELECT	--	recursive member
				e.id, e.givenname,e.familyname, e.supervisorid,
				--	CAST(concat(cte.name,'>',e.givenname,' ',e.familyname) AS varchar(max))
				CAST(concat(e.givenname,' ',e.familyname,'<',cte.name) AS varchar(max))
			FROM cte JOIN employees e ON cte.id=e.supervisorid
		)
		SELECT * FROM cte;

	--	More Comprehensive CTE
		WITH cte AS (
		--	Anchor
			SELECT
				id,givenname,familyname,--supervisorid,
				0 as level,
				cast(givenname+' '+familyname AS varchar(MAX)) AS supervisor,
				cast(givenname+' '+familyname AS varchar(MAX)) AS hierarchy
			FROM employees WHERE supervisorid IS NULL
		UNION ALL
		--	Recursive
			SELECT
				s.id,s.givenname,s.familyname,--s.supervisorid,
				level+1,
				cast(s.givenname+' '+s.familyname AS varchar(MAX))+' < '+cte.supervisor,
				cast(cte.hierarchy+' > '+s.givenname+' '+s.familyname AS VARCHAR(MAX))
			FROM cte JOIN employees s ON s.supervisorid=cte.id
		)
		SELECT
			id,
			space(level*5)+givenname+' '+familyname,level,supervisor,
			CASE WHEN level>0 THEN replicate('under',level)+'ling' ELSE 'boss' END AS rank
		FROM cte
		ORDER BY hierarchy
		--ORDER BY id
		;

/**	Pivot Table
    ================================================
    ================================================ */

/*	Hand-Made
    ================================================
    ================================================ */
	--	PostgreSQL
		SELECT
			concat(floor(date_part('year',dob)/10)*10,'s') AS decade,

			count(CASE WHEN state='NSW' THEN 1 END) AS nsw,
			count(CASE WHEN state='VIC' THEN 1 END) AS vic,
			count(CASE WHEN state='QLD' THEN 1 END) AS qld,
			count(CASE WHEN state='ACT' THEN 1 END) AS act,
			count(CASE WHEN state='TAS' THEN 1 END) AS tas,
			count(CASE WHEN state='NT' THEN 1 END) AS nt,
			count(CASE WHEN state='SA' THEN 1 END) AS sa,
			count(CASE WHEN state='WA' THEN 1 END) AS wa
		FROM customers
		WHERE dob IS NOT NULL
		GROUP BY concat(floor(date_part('year',dob)/10)*10,'s');

	--	MSSQL
		SELECT
			concat(floor(year(dob)/10)*10,'s') AS decade,

			count(CASE WHEN state='NSW' THEN 1 END) AS nsw,
			count(CASE WHEN state='VIC' THEN 1 END) AS vic,
			count(CASE WHEN state='QLD' THEN 1 END) AS qld,
			count(CASE WHEN state='ACT' THEN 1 END) AS act,
			count(CASE WHEN state='TAS' THEN 1 END) AS tas,
			count(CASE WHEN state='NT' THEN 1 END) AS nt,
			count(CASE WHEN state='SA' THEN 1 END) AS sa,
			count(CASE WHEN state='WA' THEN 1 END) AS wa
		FROM customers
		WHERE dob IS NOT NULL
		GROUP BY floor(year(dob)/10)*10;

	--	Another Example
		USE expenses;
		SELECT
			date,
			sum(CASE WHEN nationality='French' THEN price ELSE 0 END) AS French,
			sum(CASE WHEN nationality='Spanish' THEN price ELSE 0 END) AS Spanish,
			sum(CASE WHEN nationality='Austrian' THEN price ELSE 0 END) AS Austrian
		FROM expenses
		GROUP BY date;

/*	MSSQL Pivot Table
	================================================
	Usually need a CTE or Sub Query since table data
	is generally unsuitable.

	SELECT row_headers,values,column
	FROM table
	PIVOT(aggregate(value) FOR column IN(column_values)) AS …;

	╔══════╦════════╦════════╦════════╗
	║ data ║ column ║ column ║ column ║
	╠══════╬════════╬════════╬════════╣
	║ row  ║ value  ║ value  ║ value  ║
	║ row  ║ value  ║ value  ║ value  ║
	║ row  ║ value  ║ value  ║ value  ║
	╚══════╩════════╩════════╩════════╝
	================================================ */

	WITH cte AS (SELECT year(dob) AS year,id,state FROM customers)
	SELECT *
	FROM cte
	PIVOT(count(id) FOR state IN(vic,qld,ca)) AS whatever;
