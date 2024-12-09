import os
import random
import datetime
import pandas as pd
import json
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from autogen import ConversableAgent, config_list_from_json
from components.agents.game.player import *
from components.agents.game.master import *
from components.agents.manager.websocket import WebSocketConnectionManager

app = FastAPI()

def create_player(player_name, role_desc, backend, is_human=False, websocket=None, websocket_manager=None):
    player = Player(
        name=player_name,
        role_desc=role_desc,
        global_prompt="Welcome to the Avalon game!",  # Example prompt
        llm_config=backend,
        is_human=is_human,
        websocket=websocket,
        websocket_manager=websocket_manager,
    )
    return player

@app.head("/")
async def root_head():
    return {"message": "Uvicorn server is running"}

@app.websocket("/avalon")
async def websocket_endpoint(websocket: WebSocket):
    # Accept WebSocket connection
    websocket_manager = WebSocketConnectionManager()
    await websocket.accept()

    # Set up output folder for game logs
    folder_name = 'output/' + 'game_' + str(datetime.datetime.now().date()) + '-' + str(datetime.datetime.now().hour) + '-' + str(datetime.datetime.now().minute) + '-' + str(datetime.datetime.now().second)
    if not os.path.exists(folder_name):
        os.makedirs(folder_name)
    file_name = folder_name + '/conversation'

    # Initialize players and roles
    players_no = [1, 2, 3, 4, 5]
    characters = ['Merlin', 'Percival', 'Servant', 'Assassin', 'Morgana']
    name2role = {}
    role2name = {}
    shuffled_players = random.sample(players_no, 5)
    for index, player_no in enumerate(shuffled_players):
        name2role[f'Player{player_no}'] = characters[index]
        role2name[characters[index]] = f'Player{player_no}'

    human_players = [1, 2]  # Player1 and Player2 are human players

    # Log the human player information
    human_player_names = [f"Player{player_no}" for player_no in human_players]
    print(f"********* Human Players for this game: {', '.join(human_player_names)} *********")

    # Load backend configuration
    config_list = config_list_from_json(env_or_file="OAI_CONFIG_LIST")
    backend = {"config_list": config_list}

    # Set up players
    players = {}
    for player_no in players_no:
        player_name = f"Player{player_no}"
        role_desc = name2role[player_name]
        is_human = player_no in human_players
        websocket_player = websocket if is_human else None
        additional_info = ""

        if role_desc == 'Assassin':
            additional_info = [name for name in name2role if name2role[name] == 'Morgana'][0]
        elif role_desc == 'Morgana':
            additional_info = [name for name in name2role if name2role[name] == 'Assassin'][0]
        elif role_desc == 'Merlin':
            additional_info = [name for name in name2role if name2role[name] in ['Morgana', 'Assassin']]
            additional_info = ','.join(additional_info)
        elif role_desc == 'Percival':
            additional_info = [name for name in name2role if name2role[name] in ['Morgana', 'Merlin']]
            additional_info = ','.join(additional_info) + " .However, you don't know which one is Merlin and which one is Morgana."

        players[player_name] = create_player(
            player_name, 
            f"{role_desc}. {additional_info}", 
            backend, 
            is_human=is_human, 
            websocket=websocket_player, 
            websocket_manager=websocket_manager
        )

    # Save initial game logs
    conversation_df = pd.DataFrame(columns=['agent_name', 'visible_to', 'content', 'turn', 'timestamp', 'msg_type'])
    conversation_df.to_csv(file_name + '.csv', index=False)

    with open(folder_name + "/player_roles.json", "w") as f:
        json.dump(role2name, f)

    # Set up moderator and environment
    moderator = ConversableAgent(name='game master', llm_config=backend, system_message="You are a helpful game moderator")
    env = AvalonVanilla(websocket, players, moderator, role2name, name2role, folder_name)

    # Main game loop
    async def game_loop():
        print("Starting an example run of 5 steps...")
        await websocket.send_text(json.dumps({
            "sender": "server", 
            "recipient": "all", 
            "content": "WebSocket connected", 
            "turn": 1, 
            "timestamp": str(datetime.datetime.now())
        }))

        total_rounds = 7

        while not env._terminal:
            try:
                player_name = env.get_next_player()
                player = players[player_name]
                print(f"Current player: {player_name}")

                if player.is_human:
                    try:
                        print(f"Waiting for input from human player: {player.name}")
                        action = await player.generate_reply()
                        
                        # Handle the initial role assignment response
                        if isinstance(action, dict) and any(key in action for key in ['Merlin', 'Percival', 'Loyal Servant', 'Morgana', 'Assassin']):
                            print("Received role assignments, continuing game...")
                            continue
                            
                        if isinstance(action, str):
                            try:
                                action_content = json.loads(action)
                            except json.JSONDecodeError:
                                action_content = {"Think": action, "Speak": action}
                        else:
                            action_content = action
                        print(f"Received input from human player: {action_content}")
                    except Exception as e:
                        print(f"Error processing human input: {str(e)}")
                        action_content = {
                            "Think": "Error occurred during input processing",
                            "Speak": "Error occurred during input processing"
                        }
                else:
                    # Generate action for AI player
                    action = player.generate_AI_reply()
                    action_content = action["content"]
                    print(f"Generated input from AI player: {action}")

                await asyncio.sleep(2)
                terminal = env.step(player_name, action_content)
                
                if terminal:
                    break

            except Exception as e:
                print(f"Error in game loop: {str(e)}")
                continue

    await game_loop()

    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        print("WebSocket connection closed")