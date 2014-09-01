<?php

require_once 'upload-class.php';

$files = $_FILES['file'];

$path = $_FILES['file']['name'];
$ext = pathinfo($path, PATHINFO_EXTENSION);

$upload_dir = 'tmp';


if (!empty($files)) {


    $upload = Upload::factory($upload_dir);

    // Set max file size
    $upload->set_max_file_size(2);

    $upload->set_allowed_mime_types(array("image/jpeg", "image/png"));

    $upload->file($files);

    $results = $upload->upload();

    $file_name = $results['filename'];

    $file_path = $upload_dir.'/'.$file_name;

    // Make a thumbnail
    //make_thumb($file_path, 'tmp/thumb/'.$file_name, 100, $ext);

    header('Content-Type: application/json');
    echo json_encode(array('fileName' => $results["filename"],'filePath' => $path));

}


