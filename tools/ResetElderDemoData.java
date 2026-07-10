import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public class ResetElderDemoData {
    private static final List<String> TABLES = List.of(
            "warning_event_log",
            "timeline_event",
            "ai_health_report",
            "followup_task",
            "follow_record",
            "follow_plan",
            "intervention_record",
            "assessment_record",
            "physical_exam",
            "vital_sign_data",
            "wearable_device",
            "health_warning",
            "referral_order",
            "nursing_record",
            "nursing_plan",
            "medical_history",
            "medication_record",
            "allergy_record",
            "family_history",
            "health_record",
            "elder_risk_profile",
            "elder_info"
    );

    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault(
                "MEDICAL_DB_URL",
                "jdbc:mysql://localhost:3306/medical_doctor?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
        );
        String username = System.getenv().getOrDefault("MEDICAL_DB_USER", "root");
        String password = System.getenv().getOrDefault("MEDICAL_DB_PASSWORD", "123456");
        String backupDatabase = "medical_doctor_backup_" + LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));

        try (Connection connection = DriverManager.getConnection(url, username, password);
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE DATABASE `" + backupDatabase + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            for (String table : TABLES) {
                statement.execute("CREATE TABLE `" + backupDatabase + "`.`" + table + "` LIKE `medical_doctor`.`" + table + "`");
                statement.execute("INSERT INTO `" + backupDatabase + "`.`" + table + "` SELECT * FROM `medical_doctor`.`" + table + "`");
            }

            connection.setAutoCommit(false);
            try {
                statement.execute("SET FOREIGN_KEY_CHECKS=0");
                for (String table : TABLES) {
                    statement.executeUpdate("DELETE FROM `medical_doctor`.`" + table + "`");
                }
                connection.commit();
            } catch (Exception error) {
                connection.rollback();
                throw error;
            } finally {
                statement.execute("SET FOREIGN_KEY_CHECKS=1");
                connection.setAutoCommit(true);
            }

            for (String table : TABLES) {
                statement.execute("ALTER TABLE `medical_doctor`.`" + table + "` AUTO_INCREMENT=1");
            }

            try (ResultSet result = statement.executeQuery("SELECT COUNT(*) FROM medical_doctor.elder_info")) {
                result.next();
                if (result.getLong(1) != 0) {
                    throw new IllegalStateException("elder_info reset verification failed");
                }
            }
        }

        System.out.println("BACKUP_DATABASE=" + backupDatabase);
        System.out.println("CLEARED_TABLE_COUNT=" + TABLES.size());
        System.out.println("ELDER_COUNT_AFTER_RESET=0");
    }
}
