<?php
header("Content-Type: application/json");

// 1. Conexión única a la base de datos centralizada.
// Nótese: una sola conexión, un solo archivo, para resolver todo el negocio.
$host = "localhost";
$user = "root";
$password = "";
$database = "monolito_demo_db";

$conn = new mysqli($host, $user, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Error de conexión: " . $conn->connect_error]);
    exit();
}

// Sin esta línea, los acentos y eñes salen corruptos en el JSON de salida
// (un problema real de codificación, no cosmético — vale la pena señalarlo
// en clase si algún alumno lo topa antes de que tú lo menciones).
$conn->set_charset("utf8mb4");

// 2. EL ENFOQUE MONOLÍTICO: un solo QUERY resuelve todo el problema de negocio.
// La base de datos se encarga de cruzar los datos del préstamo con los del
// lector. En un monolito, este tipo de JOIN es gratis y natural — las dos
// piezas de información "viven en la misma casa".
$sql = "SELECT p.id_prestamo AS ticket,
               p.libro AS libro_prestado,
               l.nombre AS nombre_lector
        FROM prestamos p
        INNER JOIN lectores l ON p.lector_id = l.id
        WHERE p.id_prestamo = 1";

$result = $conn->query($sql);

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $resultado_final = [
        "ticket" => (int)$row['ticket'],
        "libro_prestado" => $row['libro_prestado'],
        "nombre_lector" => $row['nombre_lector'],
    ];
    echo json_encode($resultado_final);
} else {
    http_response_code(404);
    echo json_encode(["error" => "Préstamo no encontrado"]);
}

$conn->close();
