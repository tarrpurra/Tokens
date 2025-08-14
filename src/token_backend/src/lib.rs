use candid::{CandidType, Principal};
use ic_cdk::caller;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Clone, Debug, CandidType, Serialize, Deserialize)]
pub struct Metadata {
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}

struct State {
    metadata: Metadata,
    total_supply: u128,
    balances: HashMap<Principal, u128>,
    creator: Principal,
}

impl Default for State {
    fn default() -> Self {
        Self {
            metadata: Metadata {
                name: "Hero".to_string(),
                symbol: "HERO".to_string(),
                decimals: 8,
            },
            total_supply: 100_000_000_000_000, // Example supply
            balances: HashMap::new(),
            creator: Principal::anonymous(), // Will be replaced in init
        }
    }
}

thread_local! {
    static STATE: std::cell::RefCell<State> = std::cell::RefCell::new(State::default());
}

/* -------------------- Initialization -------------------- */
#[ic_cdk::init]
fn init() {
    let deployer = ic_cdk::api::caller();
    STATE.with(|s| {
        let mut st = s.borrow_mut();

        // Copy out the value first (u128 is Copy)
        let total = st.total_supply;

        st.creator = deployer;
        st.balances.insert(deployer, total);
    });
}


/* -------------------- Queries -------------------- */
#[ic_cdk::query]
fn get_metadata() -> Metadata {
    STATE.with(|s| s.borrow().metadata.clone())
}

#[ic_cdk::query]
fn total_supply() -> u128 {
    STATE.with(|s| s.borrow().total_supply)
}

#[ic_cdk::query]
fn balance_of(owner: Principal) -> u128 {
    STATE.with(|s| {
        let st = s.borrow();
        *st.balances.get(&owner).unwrap_or(&0)
    })
}

#[ic_cdk::query]
fn get_creator() -> Principal {
    STATE.with(|s| s.borrow().creator)
}

/* -------------------- Updates -------------------- */
#[ic_cdk::update]
fn transfer(to: Principal, amount: u128) -> Result<(), String> {
    if amount == 0 { return Ok(()); }
    let from = caller();

    STATE.with(|s| {
        let mut st = s.borrow_mut();

        let from_bal = st.balances.get(&from).copied().unwrap_or(0);
        if from_bal < amount {
            return Err("Insufficient balance".to_string());
        }

        st.balances.insert(from, from_bal - amount);
        let to_bal = st.balances.get(&to).copied().unwrap_or(0);
        st.balances.insert(to, to_bal + amount);
        Ok(())
    })
}

#[ic_cdk::update]
fn mint(to: Principal, amount: u128) -> Result<(), String> {
    if amount == 0 { return Ok(()); }
    let caller_principal = caller();

    STATE.with(|s| {
        let mut st = s.borrow_mut();
        if caller_principal != st.creator {
            return Err("Only the creator can mint tokens".to_string());
        }

        let to_bal = st.balances.get(&to).copied().unwrap_or(0);
        st.balances.insert(to, to_bal + amount);
        st.total_supply = st.total_supply.saturating_add(amount);
        Ok(())
    })
}
#[ic_cdk::query]
fn current_user() -> Principal {
    ic_cdk::api::caller()
}

/* -------------------- Candid export -------------------- */
ic_cdk::export_candid!();
