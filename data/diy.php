<?php
	/*:	DIY 2.2: Putting the Date in the Footer …
		================================================
		Open the file index.php. Find the footer div, and
		put an HTML break, followed by a PHP output block
		at the end:
		================================================ */
		<div id="footer">Copyright © — Share &amp; Enjoy<br>
			<?= date('l, jS F Y'); ?></div>


	/*:	DIY 2.3: Preparing and Implementing Includes
		================================================
		The project already has a folder called includes,
		which we will use for locating our included files.
		Open the file index.php, and locate the part of
		the head section between the comments:
		================================================ */
		<!-- begin head.php -->
			…
		<!-- end head.php -->
	/*	================================================
		Cut the content between the comments and paste it
		into a new file and save the file as head.php
		inside the includes folder. Replace the cut
		contents with the following code:
		================================================ */
		<?php require_once 'includes/head.php'; ?>
	/*	================================================
		You can also delete the comments which are only there as markers.
		Repeat the process for the following files: banner.php, nav.php,
		footer.php and test your page. If you look at the source in the
		browser, you will not see any difference, except, possibly,
		line spacing. This is good.
		Replace the corresponding blocks for about.php. In this case,
		we do not need to create any more includable files.
		================================================ */

	/*:	Chapter 7
		================================================
		================================================ */

	/*:	DIY 7.1: The makeThumbnail() stub
		================================================
		You already have a library file, library.php in
		your includes folder. Add the following function
		in your file:
		================================================ */
		function makeThumbnail($source, $destination, $size='160x120') {
			list($width, $height) = preg_split('/\s*x\s*/', $size);
		}

	/*:	DIY 7.2: Reading the Image Information
		================================================
		Add the following to your function stub:
		================================================ */
		function loadImage($fileName) {
			$imageInfo = getimagesize($fileName);
			list($width, $height, $type) = $imageInfo;
			$mime = $imageInfo['mime'];

			//  return data when finished
		}

	/*:	DIY 7.3: Using the switch() statement
		================================================
		Add the following to your function:
		================================================ */
		function loadImage($fileName) {
			$imageInfo = getimagesize($fileName);
			list($width, $height, $type) = $imageInfo;
			$mime = $imageInfo['mime'];

			switch ($mime) {
				case 'image/gif':
					$image = imagecreatefromgif($fileName);
					break;
				case 'image/jpeg':
					$image = imagecreatefromjpeg($fileName);
					break;
				case 'image/png':
					$image = imagecreatefrompng($fileName);
					break;
				default:
					$image = null;
			}

			return [$image, $width, $height, $mime];
		}

	/*:	DIY 7.4: The saveImage() Stub
		================================================
		Add the following to your code, before the makeThumbnail() stub:
		================================================ */
		function saveImage($image, $fileName, $mime='image/jpeg') {

		}

	/*:	DIY 7.5: The saveImage Function
		================================================
		Add the following function:
		================================================ */
		function saveImage($image, $fileName, $mime='image/jpeg') {
			switch ($mime) {
				case 'image/gif':
					return imagegif($image, $fileName);
				case 'image/jpeg':
					return imagejpeg($image, $fileName);
				case 'image/png':
					return imagepng($image, $fileName);
				default:
					return false;
			}
		}

	/*:	DIY 7.6: Outlining the makeThumbnail() code
		================================================
		Add the Following code to your makeThumbnail() stub:
		================================================ */
		function makeThumbnail($source, $destination, $size='160x120') {
			list($width, $height) = preg_split('/\s*x\s*/', $size);
			//  Load Image and get image data
				list($image, $sw, $sh, $mime) = loadImage($source, true);
			//  Create an empty Thumbnail Image

			//  Make padding adjustments

			//  Copy the Original into the Smaller Image

			//  Save image file
				saveImage($thumbnail, $destination, $mime);
		}

	/*:	DIY 7.7: Creating and Empty Image
		================================================
		Add the following to your code:
		================================================ */
		function makeThumbnail(…) {
			…
			//  Create an empty Thumbnail Image
				$thumbnail = imagecreatetruecolor($width, $height);
		}

	/*:	DIY 7.8: Using imagecopyresampled()
		================================================ */
	/*	Step 1: Add the following variables to your code:
		================================================ */
		function makeThumbnail(…) {
			…
			//  Make padding adjustments
				$tx = $ty = 0;  // Top Left of Thumbnail; Change Later
				$sx = $sy = 0;  // Copy from the original top left
				$tw = $width;     // Function parameters; change later
				$th = $height;
				//  $sw and $sh already determined previously
			…
		}

	/*	Step 2: Now Add the function call to your code:
		================================================ */
		function makeThumbnail(…) {
			…
			//  Make padding adjustments
			…
			//  Copy the Original into the Smaller Image
				imagecopyresampled(
					$thumbnail, $image,     //  destination, source
					$tx, $ty, $sx, $sy,     //  top-left (origin)
					$tw, $th, $sw, $sh  //  width & height
				);
			…
		}

	/*:	DIY 7.9: The Upload Page
		================================================ */
	/*	Step 1: Add the following near the beginning of your images.inc.php page:
		================================================ */
		require_once 'includes/library.php';

	/*	Step 2:  For convenience, copy the images nested array into into a variable, and use the new variable:
		================================================ */
		//  Keep Original
			$settings = $CONFIG['images'];
			move_uploaded_file($_FILES['image']['tmp_name'],
				"{$settings['originals/path']}/$name");

	/*	Step 3: Add the function call to create your thumbnail:
		================================================ */
		if(!$errors) {
			…
			//  Make Thumbnails
			makeThumbnail(
				"{$settings['originals/path']}/$name",
				"{$settings['thumbnails/path']}/$name",
				$settings['thumbnails/size']
			);
			…
		}

	/*:	DIY 7.10: Aspect Ratio
		================================================
		Add the following calculations to your code:
		================================================ */
		function makeThumbnail(…) {
			…
			//  Make padding adjustments
				…
				//  $sw and $sh already determined previously
					$sourceShape = $sw/$sh;   //  from source
					$thumbShape = $tw/$th;    //  from thumbnail

			//  Copy the Original into the Smaller Image
			…
		}
	/*	================================================
		Add the following if statement:
		================================================ */
		//  $sw and $sh already determined previously
			$sourceShape = $sw/$sh; //  from source
			$thumbShape = $tw/$th;  //  from thumbnail
			if($sourceShape<$thumbShape) {
					//  original is thinner

			}
			elseif($sourceShape>$thumbShape) {
					//  original is wider

			}

	/*:	DIY 7.11: Adjust Width & Height
		================================================
		Add the following in your if statement:
		================================================ */
		if($sourceShape<$thumbShape) {
			//  original is thinner
				$tw = $th * $sourceShape;
			//  Leave $th as it is
		}
		elseif($sourceShape>$thumbShape) {
			//  original is wider
				$th = $tw / $sourceShape;
			//  Leave $tw as it is
		}

	/*:	DIY 7.12: Adjusting the Position
		================================================
		Add the following in your if statement:
		================================================ */
		if($sourceShape<$thumbShape) {
			//  original is thinner
				$tw = $th * $sourceShape;
			//  Leave $th as it is
				$tx = ($width - $tw) /2;
		}
		elseif($sourceShape>$thumbShape) {
			//  original is wider
				$th = $tw / $sourceShape;
			//  Leave $tw as it is
				$ty = ($height - $th) /2;
		}

	/*:	DIY 7.13: Using the makeThumbnail Function
		================================================
		In your images.inc.php file, add the function calls to create the rest of your thumbnail:
		================================================ */
		if(!$errors) {
			…
			makeThumbnail(
				"{$settings['originals/path']}/$name",
				"{$settings['thumbnails/path']}/$name",
				$settings['thumbnails/size']
			);
			makeThumbnail(
				"{$settings['originals/path']}/$name",
				"{$settings['previews/path']}/$name",
				$settings['previews/size']
			);
			makeThumbnail(
				"{$settings['originals/path']}/$name",
				"{$settings['icons/path']}/$name",
				$settings['icons/size']
			);

		}

	/*:	The makeThumbnail() Function
		================================================
		================================================ */

		function makeThumbnail($source, $destination, $size='160x120') {
			//  Load Image and get image data
				list($image, $sw, $sh, $mime) = loadImage($source);

			//  Create an empty Thumbnail Image
				$thumbnail = imagecreatetruecolor($width, $height);

			//  Make padding adjustments for different aspect ratios
				$tx = $ty = 0;						//  Into top left of thumbnail;
				$sx = $sy = 0;						//  Copy from the original top left
				$tw = $width; $th = $height;		// Use parameters
				//  $sw and $sh already determined previously

				$sourceShape = $sw/$sh;				//  source dimenstions
				$thumbShape = $tw/$th;				//  thumbnail dimensions

				if($sourceShape<$thumbShape) {		//  original thinner
					$tw = $th * $sourceShape;		//  Leave $th
					$tx = ($width - $tw) /2;
				}
				elseif($sourceShape>$thumbShape) {	//  original wider
					$th = $tw / $sourceShape;		//  Leave $tw
					$ty = ($height - $th) /2;
				}

			//  Copy the Original into the Smaller Image
				imagecopyresampled(
					$thumbnail, $source,			// destination, source
					$tx, $ty, $sx, $sy,				//  top-left corner (origin)
					$tw, $th, $sw, $sh				//  width & height
				);

			//  Save image file
				saveImage($destination, $thumbnail, $type);
		}
