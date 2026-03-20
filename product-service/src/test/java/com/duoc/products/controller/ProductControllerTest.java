package com.duoc.products.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.duoc.products.dto.ProductDto;
import com.duoc.products.service.ProductService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

// Levanta solo la capa web del controlador (más rápido que @SpringBootTest).
@WebMvcTest(ProductController.class)
class ProductControllerTest {

    // MockMvc permite simular requests HTTP sin levantar servidor real.
    @Autowired
    private MockMvc mockMvc;

    // Reemplaza el bean real ProductService por un mock dentro del contexto web.
    @MockitoBean
    private ProductService productService;

    @Test
    void getAllProducts_returns200AndList() throws Exception {
        // Arrange: datos simulados que devolverá el servicio.
        List<ProductDto> products = List.of(
                ProductDto.builder().id(1L).name("Laptop").description("Dev").price(1000.0).stock(10).build(),
                ProductDto.builder().id(2L).name("Mouse").description("Ergo").price(50.0).stock(20).build()
        );

        // Arrange: programamos el comportamiento del mock.
        when(productService.getAllProducts()).thenReturn(products);

        // Act + Assert: request GET y validación de status + payload JSON.
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Laptop"))
                .andExpect(jsonPath("$[1].id").value(2));
    }

    @Test
    void getProductById_returns200_whenProductExists() throws Exception {
        // Arrange
        ProductDto product = ProductDto.builder()
                .id(3L)
                .name("Monitor")
                .description("IPS")
                .price(200.0)
                .stock(8)
                .build();

        when(productService.getProductById(3L)).thenReturn(Optional.of(product));

        // Act + Assert: 200 OK y contenido del objeto retornado.
        mockMvc.perform(get("/api/products/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(3))
                .andExpect(jsonPath("$.name").value("Monitor"));
    }

    @Test
    void getProductById_returns404_whenProductDoesNotExist() throws Exception {
        // Arrange: Optional vacío simula producto inexistente.
        when(productService.getProductById(404L)).thenReturn(Optional.empty());

        // Act + Assert: el controlador debe devolver 404 Not Found.
        mockMvc.perform(get("/api/products/404"))
                .andExpect(status().isNotFound());
    }
}
