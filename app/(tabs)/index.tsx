import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Modal, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [repositories, setRepositories] = useState<any[]>([]);  // Tipagem flexível com 'any[]'
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [repoId, setRepoId] = useState('');

  // Carrega os repositórios salvos ao iniciar o app
  useEffect(() => {
    async function loadRepositories() {
      try {
        const savedData = await AsyncStorage.getItem('repositories');
        if (savedData) {
          setRepositories(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Erro ao carregar dados', error);
      }
    }
    loadRepositories();
  }, []);

  // Salva os repositórios sempre que forem atualizados
  useEffect(() => {
    AsyncStorage.setItem('repositories', JSON.stringify(repositories));
  }, [repositories]);

  // Função para buscar o repositório na API do GitHub
  const fetchRepository = async () => {
    if (!ownerId || !repoId) {
      Alert.alert('Atenção', 'Preencha os dois campos!');
      return;
    }
    try {
      const response = await axios.get(`https://api.github.com/repos/${ownerId}/${repoId}`);
      const repoData = response.data;
      
      // Definindo diretamente os dados
      const newRepo = {
        id: repoData.id,
        name: repoData.name,
        description: repoData.description || 'Sem descrição',
        stars: repoData.stargazers_count,  // Dado 1 do repositório
        forks: repoData.forks_count,       // Dado 2 do repositório
        owner: {
          name: repoData.owner.login,
          profileUrl: repoData.owner.html_url,  // Dado 1 do owner
          avatarUrl: repoData.owner.avatar_url // Dado 2 do owner
        }
      };
      
      setRepositories([...repositories, newRepo]);
      setModalVisible(false);
      setOwnerId('');
      setRepoId('');
    } catch (error) {
      Alert.alert('Erro', 'Repositório não encontrado. Verifique os dados informados.');
      console.error('Erro ao buscar repositório:', error);
    }
  };

  // Função para limpar todos os repositórios salvos
  const clearRepositories = async () => {
    setRepositories([]);
    await AsyncStorage.removeItem('repositories');
  };

  return (
    <View style={styles.container}>
      {/* Header com botões + e - */}
      <View style={styles.header}>
        <Button title="+" onPress={() => setModalVisible(true)} />
        <Button title="-" onPress={clearRepositories} />
      </View>

      {/* Modal para inserir ownerId e repoId */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Repositório</Text>
            <TextInput
              placeholder="Owner ID"
              value={ownerId}
              onChangeText={setOwnerId}
              style={styles.input}
            />
            <TextInput
              placeholder="Repo ID"
              value={repoId}
              onChangeText={setRepoId}
              style={styles.input}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.addButton} onPress={fetchRepository}>
                <Text style={styles.buttonText}>Adicionar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lista de repositórios */}
      <FlatList
        data={repositories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.repoItem}>
            <Text style={styles.repoName}>{item.name}</Text>
            <Text>Descrição: {item.description}</Text>
            <Text>Estrelas: {item.stars} | Forks: {item.forks}</Text>
            <Text>Dono: {item.owner.name}</Text>
            <Text>Perfil: {item.owner.profileUrl}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 10 },
  modalTitle: { fontSize: 18, marginBottom: 10, textAlign: 'center' },
  input: { height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 10, borderRadius: 5 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  addButton: { backgroundColor: 'green', padding: 10, borderRadius: 5, width: 120, alignItems: 'center' },
  cancelButton: { backgroundColor: 'red', padding: 10, borderRadius: 5, width: 120, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold' },
  repoItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
  repoName: { fontSize: 18, fontWeight: 'bold' }
});
