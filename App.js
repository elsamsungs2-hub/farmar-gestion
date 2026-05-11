import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, StatusBar, Alert, ScrollView } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Search, Barcode, FileText, X, LayoutGrid, Pill, SprayCan, Sparkles, Package, User, MapPin } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { DATA_PRODUCTOS } from './productos';

const CATEGORIAS = [
  { nombre: 'Todos', icon: LayoutGrid },
  { nombre: 'Perfumería', icon: SprayCan },
  { nombre: 'Cuidado Personal', icon: Sparkles },
  { nombre: 'Limpieza', icon: Package },
  { nombre: 'Medicamentos', icon: Pill },
];

export default function App() {
  // --- ESTADOS DE LOGIN ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sucursal, setSucursal] = useState('');
  const [empleado, setEmpleado] = useState('');

  // --- ESTADOS DE LA APP ---
  const [busqueda, setBusqueda] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('Todos');
  const [productoEncontrado, setProductoEncontrado] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const handleLogin = () => {
    if (sucursal.trim() && empleado.trim()) {
      setIsLoggedIn(true);
    } else {
      Alert.alert("Acceso", "Por favor completa la sucursal y tu nombre.");
    }
  };

  const buscarProducto = (texto) => {
    setBusqueda(texto);
    if (texto === '') { setProductoEncontrado(null); return; }
    const encontrado = DATA_PRODUCTOS.find(p => 
      p.barras === texto || p.nombre.toLowerCase().includes(texto.toLowerCase())
    );
    setProductoEncontrado(encontrado || null);
  };

  const alEscanear = ({ data }) => {
    setEscaneando(false);
    buscarProducto(data);
  };

  const productosFiltrados = DATA_PRODUCTOS.filter(p => 
    categoriaActiva === 'Todos' || p.categoria === categoriaActiva
  );

  const generarPDF = async () => {
    const hoy = new Date();
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const vigencia = `${ultimoDia}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

    const etiquetasHtml = productosFiltrados.map(p => `
      <div class="etiqueta">
        <div class="header-etiqueta">${p.nombre.toUpperCase()}</div>
        <div class="precio-section">
          <span class="monto">
            <span class="signo">$</span>${p.precio.toLocaleString('es-AR')}<span class="coma">,</span>
          </span>
        </div>
        <div class="info-container">
          <div class="precio-info">Precio Regular $ ${p.precio.toLocaleString('es-AR')},</div>
          <div class="footer-etiqueta">
            <span class="codigo">${p.barras}</span>
            <span class="fecha">Vig: ${vigencia}</span>
          </div>
        </div>
      </div>
    `).join('');

    const htmlContent = `<html><head><style>
      @page { margin: 1mm; size: A4; }
      body { font-family: 'Helvetica', Arial, sans-serif; margin: 0; padding: 0; display: flex; flex-wrap: wrap; background-color: white; justify-content: flex-start; }
      .etiqueta { width: 25%; height: 22mm; border: 0.1pt solid #eee; padding: 0 1.2mm; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; }
      .header-etiqueta { font-size: 7pt; font-weight: bold; line-height: 0.85; height: 14pt; margin-top: 0.5mm; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
      .precio-section { text-align: center; margin: -2mm 0; line-height: 1; }
      .monto { font-size: 28pt; font-weight: 900; letter-spacing: -2px; display: flex; align-items: center; justify-content: center; }
      .signo { font-size: 14pt; margin-right: 1pt; font-weight: bold; }
      .coma { font-size: 18pt; font-weight: bold; }
      .info-container { margin-top: auto; }
      .precio-info { font-size: 5.5pt; text-align: center; margin-bottom: 0.2mm; line-height: 1; }
      .footer-etiqueta { display: flex; justify-content: space-between; align-items: flex-end; border-top: 0.5pt solid #000; padding-top: 0.3mm; margin-bottom: 0.3mm; }
      .codigo { font-size: 6pt; font-family: 'monospace'; }
      .fecha { font-size: 6pt; font-weight: bold; }
    </style></head><body>${etiquetasHtml}</body></html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (error) {
      Alert.alert("Error", "No se pudo generar el PDF");
    }
  };

  // --- VISTA: ESCÁNER ---
  if (escaneando) {
    return (
      <View style={styles.scannerContainer}>
        <CameraView style={StyleSheet.absoluteFillObject} facing="back" onBarcodeScanned={alEscanear} />
        <TouchableOpacity style={styles.botonCerrar} onPress={() => setEscaneando(false)}><X color="#fff" size={40} /></TouchableOpacity>
        <Text style={styles.textoGuia}>Apunta al código de barras</Text>
      </View>
    );
  }

  // --- VISTA: LOGIN ---
  if (!isLoggedIn) {
    return (
      <View style={styles.loginContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#004a99" />
        <View style={styles.loginCard}>
          <View style={styles.loginHeaderIcon}>
            <Pill color="#004a99" size={40} />
          </View>
          <Text style={styles.loginTitle}>SISTEMA FARMAR</Text>
          <Text style={styles.loginSubtitle}>Gestión de Góndolas</Text>
          
          <View style={styles.inputWrapper}>
            <MapPin color="#666" size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.loginInput} 
              placeholder="Sucursal (ej: Empedrado)" 
              value={sucursal}
              onChangeText={setSucursal}
            />
          </View>

          <View style={styles.inputWrapper}>
            <User color="#666" size={20} style={styles.inputIcon} />
            <TextInput 
              style={styles.loginInput} 
              placeholder="Nombre del Operador" 
              value={empleado}
              onChangeText={setEmpleado}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>INGRESAR AL SISTEMA</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionLabel}>v1.3 | Hugo Pérez Dev</Text>
      </View>
    );
  }

  // --- VISTA: APP PRINCIPAL ---
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0056b3" />
        
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>FARMAR</Text>
            <Text style={styles.headerSubtitle}>📍 {sucursal.toUpperCase()} | Op: {empleado}</Text>
          </View>
          <TouchableOpacity style={styles.pdfHeaderBtn} onPress={generarPDF}>
            <FileText color="#fff" size={24} />
            <Text style={styles.pdfHeaderText}>PDF</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContainer}>
          <Text style={styles.menuLabel}>SELECCIONAR CATEGORÍA:</Text>
          <View style={styles.menuGrid}>
            {CATEGORIAS.map((cat) => {
              const Icono = cat.icon;
              return (
                <TouchableOpacity 
                  key={cat.nombre} 
                  style={[styles.menuItem, categoriaActiva === cat.nombre && styles.menuItemActive]}
                  onPress={() => {
                    setCategoriaActiva(cat.nombre);
                    setProductoEncontrado(null);
                    setBusqueda('');
                  }}
                >
                  <Icono size={20} color={categoriaActiva === cat.nombre ? '#fff' : '#0056b3'} />
                  <Text style={[styles.menuText, categoriaActiva === cat.nombre && styles.menuTextActive]}>{cat.nombre}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.searchSection}>
          <Search color="#666" size={18} style={{ marginRight: 10 }} />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre o escáner..."
            value={busqueda}
            onChangeText={buscarProducto}
          />
        </View>

        <ScrollView style={styles.content}>
          {productoEncontrado ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>PRODUCTO DETECTADO</Text>
              <Text style={styles.prodNombre}>{productoEncontrado.nombre.toUpperCase()}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.prodPrecio}>${productoEncontrado.precio.toLocaleString('es-AR')}</Text>
                <Text style={[styles.prodStock, { color: productoEncontrado.stock < 10 ? '#d90429' : '#2b9348' }]}>
                  Stock: {productoEncontrado.stock}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.sectionTitle}>{categoriaActiva.toUpperCase()}</Text>
              {productosFiltrados.map(item => (
                <View key={item.id} style={styles.listRow}>
                  <Text style={styles.listNombre}>{item.nombre}</Text>
                  <Text style={styles.listPrecio}>${item.precio.toLocaleString('es-AR')}</Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity 
          style={styles.fab} 
          onPress={async () => {
            if (!permission.granted) await requestPermission();
            setEscaneando(true);
          }}
        >
          <Barcode color="#fff" size={30} />
        </TouchableOpacity>

        <View style={styles.footer}><Text style={styles.footerText}>v1.3 | Gestión de Stock</Text></View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  // --- NUEVOS ESTILOS LOGIN ---
  loginContainer: { flex: 1, backgroundColor: '#004a99', justifyContent: 'center', padding: 25 },
  loginCard: { backgroundColor: '#fff', borderRadius: 20, padding: 30, elevation: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 10 },
  loginHeaderIcon: { alignSelf: 'center', backgroundColor: '#f0f7ff', padding: 15, borderRadius: 50, marginBottom: 15 },
  loginTitle: { fontSize: 26, fontWeight: '900', color: '#004a99', textAlign: 'center' },
  loginSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#eee', borderRadius: 12, marginBottom: 15, paddingHorizontal: 15, backgroundColor: '#fafafa' },
  inputIcon: { marginRight: 10 },
  loginInput: { flex: 1, height: 50, fontSize: 16, color: '#333' },
  loginButton: { backgroundColor: '#e30613', height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, elevation: 5 },
  loginButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  versionLabel: { textAlign: 'center', color: 'rgba(255,255,255,0.6)', marginTop: 25, fontSize: 12 },

  // --- ESTILOS EXISTENTES ---
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { backgroundColor: '#0056b3', padding: 15, borderBottomLeftRadius: 15, borderBottomRightRadius: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 'bold' },
  pdfHeaderBtn: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 10 },
  pdfHeaderText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginTop: 2 },
  menuContainer: { padding: 15, backgroundColor: '#fff', margin: 10, borderRadius: 15, elevation: 3 },
  menuLabel: { fontSize: 10, fontWeight: 'bold', color: '#94A3B8', marginBottom: 10, letterSpacing: 1 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  menuItem: { width: '31%', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  menuItemActive: { backgroundColor: '#0056b3', borderColor: '#0056b3' },
  menuText: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 5, textAlign: 'center' },
  menuTextActive: { color: '#fff' },
  searchSection: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 15, paddingHorizontal: 15, borderRadius: 10, height: 45, borderWidth: 1, borderColor: '#E2E8F0' },
  input: { flex: 1, fontSize: 14 },
  content: { flex: 1, padding: 15 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', color: '#64748B', marginBottom: 10 },
  listRow: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', flexDirection: 'row', justifyContent: 'space-between' },
  listNombre: { fontSize: 13, color: '#334155', flex: 1 },
  listPrecio: { fontSize: 14, fontWeight: 'bold', color: '#0056b3' },
  resultCard: { backgroundColor: '#fff', padding: 20, borderRadius: 15, borderLeftWidth: 5, borderLeftColor: '#0056b3', elevation: 5 },
  resultLabel: { fontSize: 10, fontWeight: 'bold', color: '#0056b3', marginBottom: 5 },
  prodNombre: { fontSize: 18, fontWeight: 'bold', color: '#1E293B', marginBottom: 10 },
  rowInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  prodPrecio: { fontSize: 22, fontWeight: '900', color: '#0056b3' },
  prodStock: { fontSize: 16, fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 30, right: 20, backgroundColor: '#0056b3', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8 },
  footer: { padding: 10, alignItems: 'center' },
  footerText: { color: '#94A3B8', fontSize: 10 },
  scannerContainer: { flex: 1, backgroundColor: '#000' },
  botonCerrar: { position: 'absolute', top: 50, right: 30, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, padding: 5 },
  textoGuia: { position: 'absolute', bottom: 100, width: '100%', textAlign: 'center', color: '#fff', fontSize: 16 }
});