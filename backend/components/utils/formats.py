import json
import logging
import ast
import re

## this code is adapted and modified from the skateholder's repo named util.py


def parse_json_response(response, schema=None):
    try:
        if isinstance(response, dict):
            return response
            
        if not isinstance(response, (str, bytes)):
            response = json.dumps(response)
            
        print("Raw response:", response)  
        
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            match = re.search(r'{[^{}]*}', response)
            if match:
                extracted_json_object = match.group()
                print("Extracted JSON Object:", extracted_json_object)  
                try:
                    return json.loads(extracted_json_object)
                except json.JSONDecodeError:
                    return ast.literal_eval(extracted_json_object)
            else:
                raise RuntimeError("No JSON object found in the response")
                
    except Exception as e:
        print(f"Error parsing JSON: {e}")  
        if schema:
            parsed_response = parse_invalid_json(response, schema)
            return parsed_response
        raise NotImplementedError("Unhandled parsing case")



def parse_invalid_json(json_string, schema):
    print("Parsing invalid JSON string:", json_string)
    pattern = re.compile(r'"([^"]+)"\s*:\s*({[^{}]*}|"([^"]+)"|"([^"]+)$),?')
    matches = pattern.findall(json_string)
    print("Matches found:", matches)

    keys = schema.keys()
    parsed_response = {}
    if matches:
        for match in matches:
            key = match[0]
            print("Processing key:", key)  # Debugging key
            if key in keys:
                value = match[2] if match[3] == '' else match[3]
                parsed_response[key] = value
    print("Parsed response so far:", parsed_response)
    if len(keys) > len(parsed_response):
        print(f"Parsed response - {parsed_response}")
        print(f"Error in parsing - {json_string}")
    return parsed_response


def remove_non_alphabets(input_string):
    # Use regular expression to remove non-alphabetic characters
    return re.sub(r'[^a-zA-Z\s]', '', input_string).lower()

def calculate_f1_score(precision, recall):
    if precision + recall == 0:
        return 0.0
    else:
        return 2 * (precision * recall) / (precision + recall)
