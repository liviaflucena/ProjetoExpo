import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Button, Modal, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [repositories, setRepositories] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [repoId, setRepoId] = useState('');

  // Estados para edição do repositório
  const [editRepoId, setEditRepoId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStars, setEditStars] = useState('');
  const [editForks, setEditForks] = useState('');

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

  useEffect(() => {
    AsyncStorage.setItem('repositories', JSON.stringify(repositories));
  }, [repositories]);

  const fetchRepository = async () => {
    if (!ownerId || !repoId) {
      Alert.alert('Atenção', 'Preencha os dois campos!');
      return;
    }
    try {
      const response = await axios.get(`https://api.github.com/repos/${ownerId}/${repoId}`);
      const repoData = response.data;

      const newRepo = {
        id: repoData.id,
        name: repoData.name,
        description: repoData.description || 'Sem descrição',
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        owner: {
          name: repoData.owner.login,
          profileUrl: repoData.owner.html_url,
          avatarUrl: repoData.owner.avatar_url
        }
      };

      setRepositories([...repositories, newRepo]);
      setModalVisible(false);
      setOwnerId('');
      setRepoId('');
    } catch (error) {
      Alert.alert('Erro', 'Repositório não encontrado.');
      console.error('Erro ao buscar repositório:', error);
    }
  };

  const clearRepositories = async () => {
    setRepositories([]);
    await AsyncStorage.removeItem('repositories');
  };

  // Abre o modal de edição e preenche os dados do repositório
  const openEditModal = (repo: any) => {
    setEditRepoId(repo.id);
    setEditName(repo.name);
    setEditDescription(repo.description);
    setEditStars(repo.stars.toString());
    setEditForks(repo.forks.toString());
    setEditModalVisible(true);
  };

  // Atualiza os dados do repositório
  const updateRepository = async () => {
    if (!editRepoId) return;

    const updatedRepositories = repositories.map(repo =>
      repo.id === editRepoId
        ? {
            ...repo,
            name: editName,
            description: editDescription,
            stars: parseInt(editStars),
            forks: parseInt(editForks)
          }
        : repo
    );

    setRepositories(updatedRepositories);
    await AsyncStorage.setItem('repositories', JSON.stringify(updatedRepositories));

    setEditModalVisible(false);
    Alert.alert('Sucesso', 'Repositório atualizado com sucesso!');
  };

  // Função para deletar um repositório
  const deleteRepository = async (repoId: number) => {
    Alert.alert(
      'Excluir Repositório',
      'Tem certeza que deseja excluir este repositório?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          onPress: async () => {
            const updatedRepositories = repositories.filter(repo => repo.id !== repoId);
            setRepositories(updatedRepositories);
            await AsyncStorage.setItem('repositories', JSON.stringify(updatedRepositories));
            Alert.alert('Sucesso', 'Repositório deletado com sucesso!');
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="+" onPress={() => setModalVisible(true)} />
        <Button title="-" onPress={clearRepositories} />
      </View>

      {/* Modal para adicionar repositório */}
      <Modal animationType="slide" transparent visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Adicionar Repositório</Text>
            <TextInput placeholder="Owner ID" value={ownerId} onChangeText={setOwnerId} style={styles.input} />
            <TextInput placeholder="Repo ID" value={repoId} onChangeText={setRepoId} style={styles.input} />
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

      {/* Modal para editar repositório */}
      <Modal animationType="slide" transparent visible={editModalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Repositório</Text>
            <TextInput placeholder="Nome" value={editName} onChangeText={setEditName} style={styles.input} />
            <TextInput placeholder="Descrição" value={editDescription} onChangeText={setEditDescription} style={styles.input} />
            <TextInput placeholder="Estrelas" value={editStars} onChangeText={setEditStars} style={styles.input} keyboardType="numeric" />
            <TextInput placeholder="Forks" value={editForks} onChangeText={setEditForks} style={styles.input} keyboardType="numeric" />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.addButton} onPress={updateRepository}>
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
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
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.editButton} onPress={() => openEditModal(item)}>
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRepository(item.id)}>
                <Text style={styles.buttonText}>Deletar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: 
  { flex: 1, 
    paddingTop: 50, 
    paddingHorizontal: 20 
  },
  header: 
  { flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 20 
  },
  modalContainer: 
  { flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)' 
  },
  modalContent: 
  { width: 300, 
    padding: 20, 
    backgroundColor: 'rgb(255, 255, 255)', 
    borderRadius: 10 
  },
  modalTitle: 
  { fontSize: 18, 
    marginBottom: 10, 
    textAlign: 'center' 
  },
  input: 
  { height: 40, 
    borderColor: 'rgb(50, 47, 47)', 
    borderWidth: 1, 
    marginBottom: 10, 
    paddingHorizontal: 10, 
    borderRadius: 5 
  },
  modalButtons: 
  { flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  addButton: 
  { backgroundColor: 'rgb(12, 62, 226)', 
    padding: 10, 
    borderRadius: 5, 
    width: 120, 
    alignItems: 'center' 
  },
  editButton: 
  { backgroundColor: 'rgb(12, 62, 226)', 
    padding: 10, 
    borderRadius: 5, 
    width: 120, 
    alignItems: 'center' 
  },
  actionButtons: {
    flexDirection: 'row',  // Deixa os botões lado a lado
    justifyContent: 'space-between', // Dá espaço entre eles
    marginTop: 10,
  },
  cancelButton: 
  { backgroundColor: 'rgb(255, 0, 0)', 
    padding: 10, 
    borderRadius: 5, 
    width: 120, 
    alignItems: 'center' 
  },
  deleteButton: 
  { backgroundColor: 'rgb(255, 0, 0)', 
    padding: 10, 
    borderRadius: 5, 
    width: 120, 
    alignItems: 'center' 
  },
  buttonText:
   { color: 'rgb(255, 255, 255)', 
    fontWeight: 'bold' 
  },
  repoItem: 
  { padding: 15, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ddd' 
  },
  repoName: 
  { fontSize: 18, 
    fontWeight: 'bold' 
  },
  repoActions: 
  { flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
});
