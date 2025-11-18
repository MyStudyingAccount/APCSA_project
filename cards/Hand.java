package cards;

public class Hand {
	private Card[] cards;
	private int cardnums;
	public Hand(int maxCards) {
		cards=new Card[maxCards];
		cardnums=0;
	}
	public void add(Card card) {
		cards[cardnums]=card;
		cardnums++;
	}
	public int length() {
		return cardnums;
	}
	public Card get(int index) {
		return cards[index];
	}
	public Card remove(int index) {
		Card removedCard=cards[index];
		for(int i=index;i<cardnums-1;i++) {
			cards[i]=cards[i+1];
		}
		cardnums--;
		return removedCard;
	}
	@Override
	public String toString() {
		String result="";
		for(int i=0;i<cardnums;i++) {
			result+=cards[i].toString();
			if(i<cardnums-1) {
				result+=", ";
			}
		}
		return result;
	}
}
