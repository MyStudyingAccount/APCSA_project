package cards;

public class Deck {
	private Card[] cards;
	private int topCardIndex;
	public Deck() {
		cards=new Card[52];
		topCardIndex=0;
		int index=0;
		for(int suit=0;suit<4;suit++) {
			for(int value=0;value<13;value++) {
				cards[index]=new Card(suit,value);
				index++;
			}
		}
	}
	public void shuffle() {
		for(int i=0;i<cards.length;i++) {
			int j=(int)(Math.random()*cards.length);
			Card temp=cards[i];
			cards[i]=cards[j];
			cards[j]=temp;
		}
		topCardIndex=0;
	}
	
	public void cut(int index) {
		if(index<0||index>=cards.length) {
			return;
		}
		Card[] newCards=new Card[cards.length];
		int newIndex=0;
		for(int i=index;i<cards.length;i++) {
			newCards[newIndex]=cards[i];
			newIndex++;
		}
		for(int i=0;i<index;i++) {
			newCards[newIndex]=cards[i];
			newIndex++;
		}
		cards=newCards;
		topCardIndex=0;
	}

	public Card draw() {
		if(topCardIndex>=cards.length) {
			return null;
		}
		Card drawnCard=cards[topCardIndex];
		topCardIndex++;
		return drawnCard;
	}

	public void print(int numCards) {
		if(numCards<0) {
			numCards=0;
		}
		if(numCards>cards.length) {
			numCards=cards.length;
		}
		for(int i=0;i<numCards;i++) {
			System.out.print(cards[i].toString());
			if(i<numCards-1) {
				System.out.print(" ");
			}
		}
		System.out.println();
	}
}
