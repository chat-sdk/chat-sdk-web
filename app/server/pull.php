<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept");

require_once 'upload-class.php';

$input = json_decode(file_get_contents('php://input'));
$path = $input->url;

if(isset($path)) {

    $upload_dir = 'tmp';

    $ch = curl_init();
    curl_setopt ($ch, CURLOPT_URL, $path);
    curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
    $data = curl_exec($ch);

    curl_close($ch);
    $file_name = tempnam($upload_dir, "");
    $file = fopen($file_name, 'w+');
    fputs($file, $data);
    fclose($file);

    $info = pathinfo($file_name);

    echo json_encode(array('fileName' => $info['filename'],'filePath' => $path, 'error' => ""));

}
else {
    echo json_encode(array('error' => 'No url set'));
}

