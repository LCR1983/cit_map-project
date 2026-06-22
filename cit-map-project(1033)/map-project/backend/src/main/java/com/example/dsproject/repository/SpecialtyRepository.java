package com.example.dsproject.repository;

import com.example.dsproject.entity.Specialty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SpecialtyRepository extends JpaRepository<Specialty, Long> {
    // 1.都県(prefecture)と季節(season)の両方で検索するメソッド
    List<Specialty> findByPrefectureAndSeason(String prefecture, String season);

    // 2.都県(prefecture)だけで検索するメソッド(季節を問わないとき用)
    List<Specialty> findByPrefecture(String prefecture);

    // 3.季節(season)だけで検索するメソッド(都県は問わないとき用)
    List<Specialty> findBySeason(String season);

    // 4.食材(name)で検索するメソッド(都県は問わないとき用)
    List<Specialty> findByName(String name);
}
