const express = require("express");
const knex = require("knex");

const app = express();

// Configuración de la conexión a la base de datos
const dbConfig = {
  client: "mysql2",
  connection: {
    host: "precios-1.c0f6dm2ucnlg.us-east-2.rds.amazonaws.com",
    port: 3306,
    user: "candidatoPrueba",
    password: "gaspre21.M",
    database: "prueba",
  },
};

// Crear una instancia de Knex
const db = knex(dbConfig);

// Ruta para obtener la información de una estación específica utilizando parámetro de consulta
app.get("/estaciones", async (req, res) => {
  try {
    const stationId = req.query.id;

    const subquery = db
      .select("value as price", "cre_id")
      .from("prices")
      .where("cre_id", stationId)
      .as("your_station");

    const query = db
      .select(
        "s.name as Nombre",
        "s.location_x as Location_X",
        "s.location_y as Location_Y",
        "p.value as Precio",
        "b.name as Marca",
        "s_c.distance as Distancia",
        db.raw("(p.value - your_station.price) as Diferencia_Precio")
      )
      .from("stations as s")
      .join("stations_brands as s_b", "s.cre_id", "s_b.cre_id")
      .join("brands as b", "s_b.id_brand", "b.id")
      .join("stations_competitors as s_c", "s.cre_id", "s_c.cre_id")
      .join("prices as p", "s.cre_id", "p.cre_id")
      .join(subquery, "s.cre_id", "your_station.cre_id")
      .where("s.cre_id", stationId);

    const rows = await query;

    if (rows.length === 0) {
      return res.json({ error: "No se encontró la estación solicitada" });
    }

    const estacion = rows[0];

    const output = {
      Nombre: estacion.Nombre,
      Distancia: estacion.Distancia,
      "Precio por producto": estacion.Precio,
      Marca: estacion.Marca,
      "Diferencia de Precio de tu estación vs precio de tus competidores":
        estacion.Diferencia_Precio,
    };

    res.json(output);
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Ruta para obtener todas las estaciones (limitado a 10 resultados)
app.get("/estaciones-list", async (req, res) => {
  try {
    const query = db
      .select(
        "s.cre_id as Id_Estacion",
        "s.name as Nombre",
        "s.location_x as Location_X",
        "s.location_y as Location_Y",
        "p.value as Precio",
        "b.name as Marca",
        "s_c.distance as Distancia"
      )
      .from("stations as s")
      .join("stations_brands as s_b", "s.cre_id", "s_b.cre_id")
      .join("brands as b", "s_b.id_brand", "b.id")
      .join("stations_competitors as s_c", "s.cre_id", "s_c.cre_id")
      .join("prices as p", "s.cre_id", "p.cre_id")
      .limit(10);

    const rows = await query;

    const estaciones = rows.map((row) => ({
      Id_Estacion: row.Id_Estacion,
      Nombre: row.Nombre,
      Distancia: row.Distancia,
      "Precio por producto": row.Precio,
      Marca: row.Marca,
    }));

    res.json(estaciones);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor en funcionamiento en el puerto 3000");
});
