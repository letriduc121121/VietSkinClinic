package com.vietskin.backend_springboot.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
@Slf4j
public class CacheConfig implements CachingConfigurer {

    private final String redisHost;
    private final int redisPort;
    private final String redisPassword;
    private final boolean redisSsl;

    public CacheConfig(
            @Value("${spring.data.redis.host:}") String redisHost,
            @Value("${spring.data.redis.port:6379}") int redisPort,
            @Value("${spring.data.redis.password:}") String redisPassword,
            @Value("${spring.data.redis.ssl.enabled:false}") boolean redisSsl) {
        this.redisHost = redisHost;
        this.redisPort = redisPort;
        this.redisPassword = redisPassword;
        this.redisSsl = redisSsl;
    }

    private boolean redisConfigured() {
        return redisHost != null && !redisHost.isBlank();
    }

    @Bean
    public CacheManager cacheManager(ObjectMapper objectMapper) {
        if (!redisConfigured()) {
            log.warn("REDIS_HOST trống → dùng cache in-memory (ConcurrentMap), không cần Redis.");
            return new ConcurrentMapCacheManager();
        }

        log.info("Dùng Redis cache tại {}:{} (ssl={})", redisHost, redisPort, redisSsl);
        RedisCacheConfiguration base = redisCacheConfiguration(objectMapper);
        Map<String, RedisCacheConfiguration> perCacheTtl = new HashMap<>();
        perCacheTtl.put("doctor_slots",      base.entryTtl(Duration.ofSeconds(60)));
        perCacheTtl.put("appointments_list", base.entryTtl(Duration.ofSeconds(30)));
        perCacheTtl.put("patient_stats",     base.entryTtl(Duration.ofMinutes(10)));
        perCacheTtl.put("service_stats",     base.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(redisConnectionFactory())
                .cacheDefaults(base)
                .withInitialCacheConfigurations(perCacheTtl)
                .build();
    }

    private RedisConnectionFactory redisConnectionFactory() {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration(redisHost, redisPort);
        if (redisPassword != null && !redisPassword.isBlank()) {
            config.setPassword(RedisPassword.of(redisPassword));
        }
        LettuceClientConfiguration.LettuceClientConfigurationBuilder client = LettuceClientConfiguration.builder();
        if (redisSsl) {
            client.useSsl();
        }
        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, client.build());
        factory.afterPropertiesSet();
        return factory;
    }

    private RedisCacheConfiguration redisCacheConfiguration(ObjectMapper objectMapper) {
        ObjectMapper cacheObjectMapper = objectMapper.copy();
        cacheObjectMapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY
        );

        return RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofMinutes(60))
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(new GenericJackson2JsonRedisSerializer(cacheObjectMapper)));
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.error("Cache GET thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.error("Cache PUT thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.error("Cache EVICT thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.error("Cache CLEAR thất bại (Redis có thể đã sập): {}", exception.getMessage());
            }
        };
    }
}
