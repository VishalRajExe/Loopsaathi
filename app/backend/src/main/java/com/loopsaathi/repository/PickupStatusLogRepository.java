package com.loopsaathi.repository;

import com.loopsaathi.model.PickupStatusLog;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PickupStatusLogRepository extends JpaRepository<PickupStatusLog, Long> {
    List<PickupStatusLog> findByPickupIdOrderByAtAsc(String pickupId);
}
