<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");

require_once 'upload-class.php';

$upload_dir = 'tmp';


$input = json_decode(file_get_contents('php://input'));
$path = $input->url;

//$path = 'https://avatars.githubusercontent.com/u/5514010?v=2';

function getImageFromURL ($url, $upload_dir) {
    $ch = curl_init();
    curl_setopt ($ch, CURLOPT_URL, $url);
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);


    curl_close($ch);

    $file_name = tempnam($upload_dir, "");
    $file = fopen($file_name, 'w+');
    fputs($file, $data);
    fclose($file);

    $info = pathinfo($file_name);

    return $info['filename'];
}

function getDataFromURL ($url) {
    $ch = curl_init();
    curl_setopt ($ch, CURLOPT_URL, $url);
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);

    $type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

    $base64 = 'data:' . $type . ';base64,' . base64_encode($data);

    curl_close($ch);

    return $base64;
}

if(isset($path)) {

    $file_name = getImageFromURL($path, $upload_dir);

    // Now resize the image to be 100 x 100
    $new_url = 'http://'.$_SERVER['HTTP_HOST'].'/server/tmp/resize.php?src='.$file_name.'&w=100&h=100';

    $base64 = getDataFromURL($new_url);

    // Delete the temporary file to tidy up
    unlink($upload_dir .'/'. $file_name);

    echo json_encode(array('dataURL' => $base64, 'error' => ""));

}
else {
    echo json_encode(array('error' => 'No url set'));
}

