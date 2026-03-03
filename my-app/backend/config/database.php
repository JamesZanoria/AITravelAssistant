<!-- DON'T CHANGE ANYTHING -->
<!-- DON'T CHANGE ANYTHING -->
<!-- DON'T CHANGE ANYTHING -->
<!-- DON'T CHANGE ANYTHING -->
<!-- DON'T CHANGE ANYTHING --> 

<?php
class Database{
    private $host = "127.0.0.1";
    private $db_name = "ai_travel_assistant";
    private $username = "root";
    private $password = "";
    public $conn;

    // Get database connection
    public function getConnection(){
        $this->conn = null;

        try{
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4", 
                $this->username, 
                $this->password
            );

            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
        } catch(PDOException $exception){
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed");
        }

        return $this->conn;
    }
}
?>