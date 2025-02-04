import React, { useState, useEffect } from 'react';
import { View, Text, Button, Modal, TextInput, FlatList } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Corrigido aqui!

export default function App() {
  const [repos, setRepos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [ownerId, setOwnerId] = useState('');
  const [repoId, setRepoId] = useState('');

  // Carregar repositórios salvos ao iniciar
  useEffect(() => {
    const loadRepos = async () => {
      const savedRepos = await AsyncStorage.getItem('repos');
      if (savedRepos) {
        setRepos(JSON.parse(savedRepos));
      }
    };

    loadRepos();
  }, []);

  // Função para buscar os dados do repositório
  const fetchRepoData = async () => {
    try {
      const response = await axios.get(`https://api.github.com/repos/${ownerId}/${repoId}`);
      const { name, owner, stargazers_count, forks_count } = response.data;

      const repoData = {
        name,
        ownerName: owner.login,
        stargazers_count,
        forks_count,
        ownerId: owner.login,
      };

      const updatedRepos = [...repos, repoData];
      setRepos(updatedRepos);
      await AsyncStorage.setItem('repos', JSON.stringify(updatedRepos));
      setModalVisible(false);
      setOwnerId('');
      setRepoId('');
    } catch (error) {
      console.error("Erro ao buscar repositório:", error);
    }
  };

  // Função para limpar dados salvos
  const clearRepos = async () => {
    setRepos([]);
    await AsyncStorage.removeItem('repos');
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button title="+" onPress={() => setModalVisible(true)} />
        <Button title="-" onPress={clearRepos} />
      </View>

      <FlatList
        data={repos}
        keyExtractor={(item, index) => index.toString()}  {/* Corrigido aqui */}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 15 }}>
            <Text>Repositório: {item.name}</Text>
            <Text>Dono: {item.ownerName}</Text>
            <Text>Estrelas: {item.stargazers_count}</Text>
            <Text>Forks: {item.forks_count}</Text>
          </View>
        )}
      />

      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text>Adicionar Repositório</Text>
          <TextInput
            style={{ width: '100%', borderBottomWidth: 1, marginBottom: 10 }}
            placeholder="Owner ID"
            value={ownerId}
            onChangeText={setOwnerId}
          />
          <TextInput
            style={{ width: '100%', borderBottomWidth: 1, marginBottom: 20 }}
            placeholder="Repo ID"
            value={repoId}
            onChangeText={setRepoId}
          />
          <Button title="Adicionar" onPress={fetchRepoData} />
          <Button title="Cancelar" onPress={() => setModalVisible(false)} />
        </View>
      </Modal>
    </View>
  );
}
