package com.vietskin.backend_springboot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration;
import org.springframework.boot.autoconfigure.data.redis.RedisRepositoriesAutoConfiguration;
import org.springframework.scheduling.annotation.EnableScheduling;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;

@SpringBootApplication(exclude = {RedisAutoConfiguration.class, RedisRepositoriesAutoConfiguration.class})
@EnableScheduling
public class BackendSpringbootApplication {

	private static final Logger logger = LoggerFactory.getLogger(BackendSpringbootApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BackendSpringbootApplication.class, args);
	}

	@Bean
	public CommandLineRunner logDatabaseUrl(DataSource dataSource) {
		return args -> {
			try (Connection connection = dataSource.getConnection()) {
				DatabaseMetaData metaData = connection.getMetaData();
				logger.info("==================================================");
				logger.info("DATABASE CONNECTED TO URL: {}", metaData.getURL());
				logger.info("DATABASE USERNAME: {}", metaData.getUserName());
				logger.info("==================================================");
			} catch (Exception e) {
				logger.error("Failed to get database connection metadata", e);
			}
		};
	}

}

