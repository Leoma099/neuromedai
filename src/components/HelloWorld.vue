<template>

  <div class="sidebar">

      <!-- LOGO -->
      <div class="sidebar-logo">
          <p>PeopleCARE</p>
      </div>

      <div class="new-box">
          <button type="button" @click="addNewChat()">New chat +</button>
      </div>

      <div class="select-chat" v-for="(chat, index) in chats" :key="index">
          <button type="button" @click="selectChat(index)">
              {{ chat.title }}
          </button>
      </div>

      <!-- MENU -->
      <!-- <nav>

          <div class="logout-nav">
              <div>
                  <a href="">Logout</a>
              </div>
          </div>

      </nav> -->

  </div>

  <div class="main-wrapper">
      
      <header>

          <div class="left">
              <button><i class="bx bx-menu"></i></button>
          </div>

      </header>

      <div class="main">

          <div class="conversation-screen" v-if="!isEmpty" ref="conversationContainer">
              <div v-for="(item, index) in items" :key="index" :class="item.sender === 'You' ? 'message' : 'response'">
                  {{ item.message }}
              </div>
          </div>
          <div class="empty-screen" v-else>
              <h1>Welcome to AskDoctor AI. How may I help you?</h1>
          </div>

          <div class="chat-form">
              <div class="chat">
                  <form @submit.prevent="submit">
                      <div class="form-input">
                          <textarea
                              ref="messageTextarea"
                              placeholder="Ask anything about symptom"
                              v-model="form.message"
                              @input="handleInput"
                              @keydown.enter.prevent="submit">
                          </textarea>
                      </div>
                      <div class="form-wrapper">
                          <div class="files-button">
                              <button type="file" @click="addFiles()"><i class="bx bxs-file-plus"></i> Add photos and files</button>
                              <input type="file" ref="fileInput" style="display: none" multiple>
                          </div>
                          <div class="form-button">
                              <button type="submit"><i class="bx bxl-telegram"></i></button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>

      </div>

  </div>

</template>

<script>
import apiCall from "@/services/index";

// import responseMessages from '@/assets/data.json';
export default
{
  data()
  {

      return {

          items: [],

          form:
          {
              message: "",
          },

          responses: [],

          chats: [],
          activeChatIndex: null,
          chatCounter: 1,

      };

  },

  computed:
  {
      isEmpty()
      {
          return !this.items || this.items.length === 0;
      }
  },

  mounted()
  {
      this.fetchResponses();
      this.fetchConversation();
      this.fetchMessages();
  },

  methods:
  {
      async fetchResponses()
      {
          try
          {
              const response = await apiCall.get("/response");
              this.responses = response.data;
          }
          catch (error)
          {
              console.error("Error fetching responses:", error);
          }
      },

      async fetchConversation()
      {
          try
          {
              const response = await apiCall.get("/conversation");
              console.log("Fetched conversations:", response.data);
              this.chats = response.data;
          }
          catch(error)
          {
              console.error("Error fetching conversations:", error.response || error);
          }
      },

      async fetchMessages()
      {
          try
          {
              const response = await apiCall.get("/messages");
              this.items = response.data;
              console.log("All Messages:", this.items);
          }
          catch (error)
          {
              console.error("Error fetching all messages:", error);
          }
      },

      async handleInput(event)
      {
          this.autoResize(event);
      },

      autoResize(event)
      {
          const textarea = event.target;
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
      },

      addFiles()
      {
          this.$refs.fileInput.click();
      },
      
      async addNewChat() // stored new chat
      {
          try
          {
              const response = await apiCall.post('/new-chat');

              const newChat = response.data;
              this.chats.unshift({ ...newChat, messages: [] });
              this.activeChatIndex = 0;
              this.items = this.chats[this.activeChatIndex].messages;
              this.form.message = "";
          }
          catch(error)
          {
              console.error("Error creating new chat:", error);
          }
      },

      async selectChat(index)
      {
          this.activeChatIndex = index;
          const conversation = this.chats[index];

          try
          {
              const response = await apiCall.get(`/conversations/${conversation.id}/messages`);
              this.items = response.data;
              this.form.message = "";
          }
          catch (error)
          {
              console.error("Error fetching messages:", error);
          }
      },

      async submit()
      {
          try
          {
              const userInput = this.form.message.trim();
              if (!userInput) return;

              if (this.activeChatIndex === null || !this.chats[this.activeChatIndex]) {
                  console.error("No active chat selected.");
                  return;
              }

              // Send user message
              await apiCall.post("/send-message", {
                  conversation_id: this.chats[this.activeChatIndex].id,
                  sender: 'You',
                  message: userInput,
              });

              // Process the bot reply (can be predefined or custom)
              const botReply = await this.getBotReply(userInput);

              // Send bot reply
              await apiCall.post("/send-message", {
                  conversation_id: this.chats[this.activeChatIndex].id,
                  sender: 'Bot',
                  message: botReply,
              });

          }
          catch (error)
          {
              console.error("Error sending message:", error);
          }
      },

      async getBotReply(userInput)
      {
          const match = this.responses.find(item =>
              item.keywords.some(keyword => userInput.toLowerCase().includes(keyword))
          );
          return match ? match.reply : "Sorry, I didn’t understand that. Could you clarify?";
      }
  },
};
</script>

<style scoped>
.form-button button
{
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: none;
}

.form-button button i
{
  font-size: 1.2rem;
}

.left button
{
  width: 30px;
  height: 30px;
  border-radius: 5px;
  border: none;
}

.left button i
{
  font-size: 1.2rem;
  font-weight: 600;
}

.files-button button
{
  width: 175px;
  height: 30px;
  border-radius: 5px;
  border: none;
}

.files-button button i
{
  font-size: 1.2rem;
}
</style>
