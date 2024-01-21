import { Cell } from '../boc/Cell';
import { DictionaryKeyTypes, Dictionary, DictionaryKey } from './Dictionary';
export declare function generateMerkleProof<K extends DictionaryKeyTypes, V>(dict: Dictionary<K, V>, key: K, keyObject: DictionaryKey<K>): Cell;
