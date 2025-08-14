import { token_backend } from '../../../declarations/token_backend';
import { Principal } from '@dfinity/principal';

export const Token = {
  getMetadata: () => token_backend.get_metadata(),
  getCreator:  async () => (await token_backend.get_creator()).toText(),
  getTotal:    async () => BigInt(await token_backend.total_supply()),
  balanceOf:   async (who) => BigInt(await token_backend.balance_of(Principal.fromText(who))),
  transfer:    async (to, amt) => token_backend.transfer(Principal.fromText(to), BigInt(amt)),
  mint:        async (to, amt) => token_backend.mint(Principal.fromText(to), BigInt(amt)),
};
