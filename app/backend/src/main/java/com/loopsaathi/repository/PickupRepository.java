package com.loopsaathi.repository;

import com.loopsaathi.model.Pickup;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PickupRepository extends JpaRepository<Pickup, String> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Pickup p where p.id = :id")
    Optional<Pickup> findForUpdate(@Param("id") String id);
}
