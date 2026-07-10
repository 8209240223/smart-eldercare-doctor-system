import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

public class AuditElderDemoData {
    public static void main(String[] args) throws Exception {
        String url = System.getenv().getOrDefault(
                "MEDICAL_DB_URL",
                "jdbc:mysql://localhost:3306/medical_doctor?useUnicode=true&characterEncoding=utf8&useSSL=false&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true"
        );
        String username = System.getenv().getOrDefault("MEDICAL_DB_USER", "root");
        String password = System.getenv().getOrDefault("MEDICAL_DB_PASSWORD", "123456");

        try (Connection connection = DriverManager.getConnection(url, username, password);
             Statement statement = connection.createStatement()) {
            long elderCount = scalar(statement,
                    "SELECT COUNT(*) FROM medical_doctor.elder_info WHERE deleted=0");
            long totalElderCount = scalar(statement,
                    "SELECT COUNT(*) FROM medical_doctor.elder_info");
            if (elderCount != 10 || totalElderCount != 10) {
                throw new IllegalStateException("expected exactly 10 elder master records, active="
                        + elderCount + ", total=" + totalElderCount);
            }

            List<String> names = new ArrayList<>();
            try (ResultSet result = statement.executeQuery(
                    "SELECT name FROM medical_doctor.elder_info ORDER BY id")) {
                while (result.next()) {
                    names.add(result.getString(1));
                }
            }

            List<String> elderTables = new ArrayList<>();
            try (ResultSet result = statement.executeQuery(
                    "SELECT table_name FROM information_schema.columns "
                            + "WHERE table_schema='medical_doctor' AND column_name='elder_id' "
                            + "ORDER BY table_name")) {
                while (result.next()) {
                    elderTables.add(result.getString(1));
                }
            }

            long orphanCount = 0;
            for (String table : elderTables) {
                long tableOrphans = scalar(statement,
                        "SELECT COUNT(*) FROM medical_doctor.`" + table + "` t "
                                + "LEFT JOIN medical_doctor.elder_info e ON t.elder_id=e.id "
                                + "WHERE t.elder_id IS NOT NULL AND (e.id IS NULL OR e.deleted<>0)");
                orphanCount += tableOrphans;
                System.out.println("TABLE=" + table + ",ROWS="
                        + scalar(statement, "SELECT COUNT(*) FROM medical_doctor.`" + table + "`")
                        + ",ORPHANS=" + tableOrphans);
            }

            if (orphanCount != 0) {
                throw new IllegalStateException("orphan elder references found: " + orphanCount);
            }
            requireAtLeast(statement, "elder_risk_profile", 10);
            requireAtLeast(statement, "follow_plan", 10);
            requireAtLeast(statement, "followup_task", 10);
            requireAtLeast(statement, "ai_health_report", 10);
            requireAtLeast(statement, "nursing_plan", 10);
            requireAtLeast(statement, "nursing_record", 10);
            long validReports = scalar(statement,
                    "SELECT COUNT(*) FROM medical_doctor.ai_health_report "
                            + "WHERE JSON_VALID(report_json)=1");
            long totalReports = scalar(statement,
                    "SELECT COUNT(*) FROM medical_doctor.ai_health_report");
            long schemaV2Reports = scalar(statement,
                    "SELECT COUNT(*) FROM medical_doctor.ai_health_report "
                            + "WHERE JSON_VALID(report_json)=1 "
                            + "AND JSON_UNQUOTE(JSON_EXTRACT(report_json, '$.schemaVersion'))='2.0'");
            if (totalReports < 10 || validReports != totalReports || schemaV2Reports != totalReports) {
                throw new IllegalStateException("structured report verification failed, valid="
                        + validReports + ", schemaV2=" + schemaV2Reports + ", total=" + totalReports);
            }

            System.out.println("ELDER_COUNT=10");
            System.out.println("ELDER_NAMES=" + String.join(",", names));
            System.out.println("ELDER_ID_TABLE_COUNT=" + elderTables.size());
            System.out.println("ORPHAN_COUNT=0");
            System.out.println("CORE_FLOW_MINIMUMS_OK=1");
            System.out.println("VALID_STRUCTURED_REPORTS=" + validReports);
            System.out.println("SCHEMA_V2_REPORTS=" + schemaV2Reports);
        }
    }

    private static long scalar(Statement statement, String sql) throws Exception {
        try (ResultSet result = statement.executeQuery(sql)) {
            result.next();
            return result.getLong(1);
        }
    }

    private static void requireAtLeast(Statement statement, String table, long minimum) throws Exception {
        long count = scalar(statement, "SELECT COUNT(*) FROM medical_doctor.`" + table + "`");
        if (count < minimum) {
            throw new IllegalStateException(table + " expected at least " + minimum + " rows, actual=" + count);
        }
    }
}
